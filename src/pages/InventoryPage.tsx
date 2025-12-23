import { useState } from 'react'
import { Product, StockMovement } from '@/types'
import { useProducts } from '@/features/products'
import { useKV } from '@github/spark/hooks'
import { StockAdjustmentForm, StockHistory } from '@/features/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function InventoryPage() {
  const { products, upsertProduct } = useProducts()
  const [stockMovements, setStockMovements] = useKV<StockMovement[]>('bioemm-stock-movements', [])
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'entry' | 'exit' | 'adjustment'>('entry')

  const productsList = products || []
  const stockMovementsList = stockMovements || []

  const handleAdjustStock = (product: Product, type: 'entry' | 'exit') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setStockAdjustmentOpen(true)
  }

  const handleStockMovement = async (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    setStockMovements((current) => [...(current || []), newMovement])
    
    const product = productsList.find(p => p.id === movementData.productId)
    if (product) {
      try {
        await upsertProduct({
          ...product,
          currentStock: movementData.newStock,
          lastRestockDate: movementData.type === 'entry' ? new Date().toISOString() : product.lastRestockDate
        })
      } catch (error) {
        toast.error('Error al actualizar el stock')
        console.error(error)
        return
      }
    }
    
    const actionText = movementData.type === 'entry' ? 'Entrada' : movementData.type === 'exit' ? 'Salida' : 'Ajuste'
    toast.success(`${actionText} de stock registrada`)
    setStockAdjustmentOpen(false)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Historial de Movimientos</TabsTrigger>
          <TabsTrigger value="products">Productos con Bajo Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <StockHistory
            movements={stockMovementsList}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {/* Aquí puedes mostrar productos con bajo stock */}
          <p>Productos con bajo stock (por implementar)</p>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <StockAdjustmentForm
          open={stockAdjustmentOpen}
          onOpenChange={setStockAdjustmentOpen}
          product={selectedProduct}
          type={adjustmentType}
          onSubmit={handleStockMovement}
        />
      )}
    </div>
  )
}
