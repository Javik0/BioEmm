import { useState } from 'react'
import { Dosification, StockMovement } from '@/types'
import { useProducts } from '@/features/products'
import { useDosifications, DosificationForm } from '@/features/dosifications'
import { useClients } from '@/features/clients'
import { useStockMovements } from '@/features/inventory'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Flask, DownloadSimple, Warning, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { importDataService } from '@/features/dosifications/services/importService'

export default function DosificationsPage() {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [dosificationToApply, setDosificationToApply] = useState<Dosification | null>(null)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [dosificationToEdit, setDosificationToEdit] = useState<Dosification | null>(null)
  const { dosifications, updateDosification } = useDosifications()
  const { products, upsertProduct } = useProducts()
  const { clients } = useClients()
  const { addStockMovement } = useStockMovements()
  const { permissions, loading: permissionsLoading } = useUserPermissions()

  const canEditDosifications = permissions.includes('dosificaciones.editar')
  const canManageInventory = permissions.includes('inventario.gestionar')

  const dosificationsList = dosifications || []
  const productsList = products || []
  const clientsList = clients || []

  const handleImportData = async () => {
    try {
      toast.loading('Importando datos...')
      const productsCount = await importDataService.importProducts()
      const protocolsCount = await importDataService.importProtocols()
      toast.dismiss()
      toast.success(`Importación completada: ${productsCount} productos y ${protocolsCount} protocolos agregados.`)
    } catch (error) {
      toast.dismiss()
      console.error(error)
      toast.error('Error al importar datos')
    }
  }

  const handleOpenEdit = (dosification: Dosification) => {
    if (permissionsLoading) {
      toast.info('Cargando permisos...')
      return
    }

    if (!canEditDosifications) {
      toast.error('No tienes permiso para editar dosificaciones')
      return
    }

    const client = clientsList.find((c) => c.id === dosification.clientId)
    if (!client) {
      toast.error('No se encontró el cliente para esta dosificación')
      return
    }

    setDosificationToEdit(dosification)
    setEditFormOpen(true)
  }

  const handleUpdateDosification = async (data: Omit<Dosification, 'id' | 'date'>) => {
    if (!dosificationToEdit) return

    if (!canEditDosifications) {
      toast.error('No tienes permiso para editar dosificaciones')
      return
    }

    const payload: Partial<Dosification> = {
      ...data,
      date: dosificationToEdit.date
    }

    const success = await updateDosification(dosificationToEdit.id, payload)
    if (success === false) return

    // Si estaba aplicada/completada, ajustar inventario y consumo según deltas
    if (dosificationToEdit.status !== 'Pendiente') {
      if (!canManageInventory) {
        toast.error('No tienes permiso para ajustar inventario')
        return
      }
      const keyFor = (p: { productId?: string; presentationId?: string }) => `${p.productId || ''}::${p.presentationId || 'base'}`

      const oldMap = new Map<string, number>()
      dosificationToEdit.products.forEach((p) => {
        if (p.productId) oldMap.set(keyFor(p), p.quantity)
      })

      const newMap = new Map<string, number>()
      data.products.forEach((p) => {
        if (p.productId) newMap.set(keyFor(p), p.quantity)
      })

      const keys = new Set<string>([...oldMap.keys(), ...newMap.keys()])

      for (const key of keys) {
        const oldQty = oldMap.get(key) || 0
        const newQty = newMap.get(key) || 0
        const delta = newQty - oldQty
        if (delta === 0) continue

        const [productId, presentationIdRaw] = key.split('::')
        const presentationId = presentationIdRaw === 'base' ? undefined : presentationIdRaw
        const product = productsList.find((p) => p.id === productId)
        if (!product) {
          toast.warning(`No se encontró el producto para ajustar inventario (${productId})`)
          continue
        }

        const isExit = delta > 0
        const absQty = Math.abs(delta)

        if (presentationId) {
          const pres = product.presentations?.find((p) => p.id === presentationId)
          if (!pres) continue
          const newPresentationStock = isExit
            ? (pres.stock?.current ?? 0) - absQty
            : (pres.stock?.current ?? 0) + absQty
          const updatedPresentations = product.presentations!.map((p) =>
            p.id === presentationId ? { ...p, stock: { ...p.stock, current: newPresentationStock } } : p
          )
          const aggregatedCurrent = updatedPresentations.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0)
          const aggregatedMin = updatedPresentations.reduce((acc, p) => acc + (p.stock?.min ?? 0), 0)
          const aggregatedMax = updatedPresentations.every((p) => p.stock?.max == null)
            ? undefined
            : updatedPresentations.reduce((acc, p) => acc + (p.stock?.max ?? 0), 0)

          const movement: Omit<StockMovement, 'id'> = {
            productId: product.id,
            productName: product.name,
            presentationId,
            presentationLabel: pres.label,
            type: isExit ? 'exit' : 'entry',
            quantity: absQty,
            previousStock: pres.stock?.current ?? 0,
            newStock: newPresentationStock,
            clientId: dosificationToEdit.clientId,
            clientName: dosificationToEdit.clientName,
            reason: `Ajuste por edición de dosificación ${dosificationToEdit.clientName}`,
            relatedTo: {
              type: 'dosification',
              id: dosificationToEdit.id,
              reference: `Ajuste dosificación - Cliente: ${dosificationToEdit.clientName}`
            },
            createdAt: new Date().toISOString()
          }

          await addStockMovement(movement)
          await upsertProduct({
            ...product,
            presentations: updatedPresentations,
            currentStock: aggregatedCurrent,
            minStock: aggregatedMin,
            maxStock: aggregatedMax
          })
        } else {
          const newStock = isExit ? product.currentStock - absQty : product.currentStock + absQty
          const movement: Omit<StockMovement, 'id'> = {
            productId: product.id,
            productName: product.name,
            type: isExit ? 'exit' : 'entry',
            quantity: absQty,
            previousStock: product.currentStock,
            newStock,
            clientId: dosificationToEdit.clientId,
            clientName: dosificationToEdit.clientName,
            reason: `Ajuste por edición de dosificación ${dosificationToEdit.clientName}`,
            relatedTo: {
              type: 'dosification',
              id: dosificationToEdit.id,
              reference: `Ajuste dosificación - Cliente: ${dosificationToEdit.clientName}`
            },
            createdAt: new Date().toISOString()
          }

          await addStockMovement(movement)
          await upsertProduct({ ...product, currentStock: newStock })
        }
      }
    }

    toast.success('Dosificación actualizada')
    setEditFormOpen(false)
    setDosificationToEdit(null)
  }

  const handleApplyDosification = async (dosification: Dosification) => {
    if (dosification.status === 'Aplicada' || dosification.status === 'Completada') {
      toast.error('Esta dosificación ya fue aplicada')
      return
    }

    const stockIssues: string[] = []
    
    dosification.products.forEach(dosProduct => {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) {
        stockIssues.push(`${dosProduct.productName}: Producto no encontrado en inventario`)
        return
      }

      const presentation = dosProduct.presentationId
        ? product.presentations?.find((p) => p.id === dosProduct.presentationId)
        : undefined

      const available = presentation
        ? presentation.stock?.current ?? 0
        : product.presentations?.length
          ? product.presentations.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0)
          : product.currentStock

      if (available < dosProduct.quantity) {
        stockIssues.push(
          `${dosProduct.productName}${dosProduct.presentationLabel ? ` (${dosProduct.presentationLabel})` : ''}: Stock insuficiente (Disponible: ${available} ${dosProduct.unit}, Requerido: ${dosProduct.quantity} ${dosProduct.unit})`
        )
      }
    })

    if (stockIssues.length > 0) {
      toast.error(
        <div>
          <p className="font-semibold">No se puede aplicar la dosificación:</p>
          <ul className="mt-2 text-xs space-y-1">
            {stockIssues.map((issue, idx) => (
              <li key={idx}>• {issue}</li>
            ))}
          </ul>
        </div>
      )
      return
    }
    setDosificationToApply(dosification)
    setConfirmDialogOpen(true)
  }

  const confirmApplyDosification = async () => {
    if (!dosificationToApply) return
    const dosification = dosificationToApply

    const now = new Date().toISOString()

    for (const dosProduct of dosification.products) {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) continue

      const presentation = dosProduct.presentationId
        ? product.presentations?.find((p) => p.id === dosProduct.presentationId)
        : undefined

      if (presentation) {
        const newPresentationStock = (presentation.stock?.current ?? 0) - dosProduct.quantity
        const updatedPresentations = product.presentations!.map((p) =>
          p.id === presentation.id ? { ...p, stock: { ...p.stock, current: newPresentationStock } } : p
        )
        const aggregatedCurrent = updatedPresentations.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0)
        const aggregatedMin = updatedPresentations.reduce((acc, p) => acc + (p.stock?.min ?? 0), 0)
        const aggregatedMax = updatedPresentations.every((p) => p.stock?.max == null)
          ? undefined
          : updatedPresentations.reduce((acc, p) => acc + (p.stock?.max ?? 0), 0)

        const movement: Omit<StockMovement, 'id'> = {
          productId: product.id,
          productName: product.name,
          presentationId: presentation.id,
          presentationLabel: presentation.label,
          type: 'exit',
          quantity: dosProduct.quantity,
          previousStock: presentation.stock?.current ?? 0,
          newStock: newPresentationStock,
          clientId: dosification.clientId,
          clientName: dosification.clientName,
          reason: `Dosificación aplicada - Cliente: ${dosification.clientName}`,
          relatedTo: {
            type: 'dosification',
            id: dosification.id,
            reference: `Dosificación - Cliente: ${dosification.clientName} - ${dosProduct.quantity} ${dosProduct.unit}`
          },
          createdAt: now
        }

        await addStockMovement(movement)
        await upsertProduct({
          ...product,
          presentations: updatedPresentations,
          currentStock: aggregatedCurrent,
          minStock: aggregatedMin,
          maxStock: aggregatedMax
        })
      } else {
        const newStock = product.currentStock - dosProduct.quantity

        const movement: Omit<StockMovement, 'id'> = {
          productId: product.id,
          productName: product.name,
          type: 'exit',
          quantity: dosProduct.quantity,
          previousStock: product.currentStock,
          newStock: newStock,
          clientId: dosification.clientId,
          clientName: dosification.clientName,
          reason: `Dosificación aplicada - Cliente: ${dosification.clientName}`,
          relatedTo: {
            type: 'dosification',
            id: dosification.id,
            reference: `Dosificación - Cliente: ${dosification.clientName} - ${dosProduct.quantity} ${dosProduct.unit}`
          },
          createdAt: now
        }

        await addStockMovement(movement)
        await upsertProduct({
          ...product,
          currentStock: newStock
        })
      }
    }

    await updateDosification(dosification.id, { status: 'Aplicada' })
  
    setConfirmDialogOpen(false)
    setDosificationToApply(null)
  
    toast.success(
      <div>
        <p className="font-semibold">Dosificación aplicada correctamente</p>
        <p className="text-xs mt-1">Stock descontado del inventario</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleImportData}>
          <DownloadSimple className="mr-2" />
          Importar Datos Iniciales
        </Button>
      </div>
      {dosificationsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flask size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground mb-2">No hay dosificaciones registradas</p>
            <p className="text-sm text-muted-foreground">
              Crea una desde la lista de clientes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dosificationsList
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((dosification) => (
              <Card key={dosification.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dosification.clientName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(dosification.date).toLocaleDateString('es-EC', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          dosification.status === 'Aplicada'
                            ? 'default'
                            : dosification.status === 'Completada'
                              ? 'default'
                              : 'secondary'
                        }
                        className={
                          dosification.status === 'Aplicada'
                            ? 'bg-green-600'
                            : dosification.status === 'Completada'
                              ? 'bg-blue-600'
                              : ''
                        }
                      >
                        {dosification.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(dosification)}
                        disabled={permissionsLoading || !canEditDosifications}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      {dosification.status === 'Pendiente' && (
                        <Button
                          size="sm"
                          onClick={() => handleApplyDosification(dosification)}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <Flask className="mr-1" size={16} weight="bold" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dosification.products.map((p) => (
                      <div key={p.productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{p.productName}</span>
                        <span className="font-medium">
                          {p.quantity} {p.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Modal de confirmación */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={24} className="text-orange-500" weight="fill" />
              ¿Aplicar dosificación?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Se aplicará la dosificación para el cliente <strong>{dosificationToApply?.clientName}</strong>.
              </p>
              <p>
                Esta acción descontará automáticamente los productos del inventario y marcará la dosificación como "Aplicada".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDosificationToApply(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyDosification}>
              Confirmar y Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {dosificationToEdit && (
        <DosificationForm
          open={editFormOpen}
          onOpenChange={(open) => {
            setEditFormOpen(open)
            if (!open) setDosificationToEdit(null)
          }}
          onSubmit={handleUpdateDosification}
          client={clientsList.find((c) => c.id === dosificationToEdit.clientId)}
          products={productsList}
          mode="edit"
          initialDosification={dosificationToEdit}
        />
      )}
    </div>
  )
}
