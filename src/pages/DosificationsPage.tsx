import { useState } from 'react'
import { Dosification, StockMovement } from '@/types'
import { useProducts } from '@/features/products'
import { useDosifications } from '@/features/dosifications'
import { useStockMovements } from '@/features/inventory'
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
import { Flask, DownloadSimple, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { importDataService } from '@/features/dosifications/services/importService'

export default function DosificationsPage() {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [dosificationToApply, setDosificationToApply] = useState<Dosification | null>(null)
  const { dosifications, updateDosification } = useDosifications()
  const { products, upsertProduct } = useProducts()
  const { addStockMovement } = useStockMovements()

  const dosificationsList = dosifications || []
  const productsList = products || []

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
      } else if (product.currentStock < dosProduct.quantity) {
        stockIssues.push(
          `${dosProduct.productName}: Stock insuficiente (Disponible: ${product.currentStock} ${product.unit}, Requerido: ${dosProduct.quantity} ${dosProduct.unit})`
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

    const movementPromises = dosification.products.map(async (dosProduct) => {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) return

      const newStock = product.currentStock - dosProduct.quantity

      const movement: Omit<StockMovement, 'id'> = {
        productId: product.id,
        productName: product.name,
        type: 'exit',
        quantity: dosProduct.quantity,
        previousStock: product.currentStock,
        newStock: newStock,
        reason: `Dosificación aplicada - Cliente: ${dosification.clientName}`,
        relatedTo: {
          type: 'dosification',
          id: dosification.id,
          reference: `Dosificación ${dosification.clientName} - ${dosProduct.quantity} ${dosProduct.unit}`
        },
        createdAt: new Date().toISOString()
      }

      await addStockMovement(movement)
    })

    await Promise.all(movementPromises)

    // Actualizar stock de productos
    try {
      const updatePromises = dosification.products.map(async (dosProduct) => {
        const product = productsList.find(p => p.id === dosProduct.productId)
        if (product) {
          return upsertProduct({
            ...product,
            currentStock: product.currentStock - dosProduct.quantity
          })
        }
      })

      await Promise.all(updatePromises)
    } catch (error) {
      toast.error('Error al actualizar el stock')
      console.error(error)
      return
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
    </div>
  )
}
