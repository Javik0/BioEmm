import { useKV } from '@github/spark/hooks'
import { Dosification, StockMovement } from '@/types'
import { useProducts } from '@/features/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flask } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function DosificationsPage() {
  const [dosifications, setDosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  const { products, upsertProduct } = useProducts()
  const [stockMovements, setStockMovements] = useKV<StockMovement[]>('bioemm-stock-movements', [])

  const dosificationsList = dosifications || []
  const productsList = products || []

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

    if (!confirm(`¿Aplicar dosificación para ${dosification.clientName}? Se descontará el stock automáticamente.`)) {
      return
    }

    dosification.products.forEach(dosProduct => {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) return

      const newStock = product.currentStock - dosProduct.quantity

      const movement: StockMovement = {
        id: Date.now().toString() + Math.random(),
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

      setStockMovements((current) => [...(current || []), movement])
    })

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

    setDosifications((current) =>
      (current || []).map((d) =>
        d.id === dosification.id ? { ...d, status: 'Aplicada' as const } : d
      )
    )

    toast.success(
      <div>
        <p className="font-semibold">Dosificación aplicada correctamente</p>
        <p className="text-xs mt-1">Stock descontado del inventario</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}
