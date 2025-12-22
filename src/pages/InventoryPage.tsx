import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, StockMovement } from '@/types'
import { StockAdjustmentForm, StockHistory } from '@/features/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [products, setProducts] = useKV<Product[]>('bioemm-products', [])
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

  const handleStockMovement = (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    setStockMovements((current) => [...(current || []), newMovement])
    
    setProducts((current) =>
      (current || []).map((p) =>
        p.id === movementData.productId
          ? { 
              ...p, 
              currentStock: movementData.newStock,
              lastRestockDate: movementData.type === 'entry' ? new Date().toISOString() : p.lastRestockDate
            }
          : p
      )
    )
    
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
