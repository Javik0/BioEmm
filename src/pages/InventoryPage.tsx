import { useMemo, useState } from 'react'
import { Product, StockMovement } from '@/types'
import { useProducts } from '@/features/products'
import { useStockMovements } from '@/features/inventory'
import { StockAdjustmentForm, StockHistory } from '@/features/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export default function InventoryPage() {
  const { products, upsertProduct } = useProducts()
  const { stockMovements, addStockMovement } = useStockMovements()
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'entry' | 'exit' | 'adjustment'>('entry')

  const productsList = products || []
  const stockMovementsList = stockMovements || []

  const lowStockProducts = useMemo(() => {
    return productsList
      .filter((product) => product.currentStock <= product.minStock)
      .sort((a, b) => {
        const deficitA = a.currentStock - a.minStock
        const deficitB = b.currentStock - b.minStock
        return deficitA - deficitB
      })
  }, [productsList])

  const handleAdjustStock = (product: Product, type: 'entry' | 'exit') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setStockAdjustmentOpen(true)
  }

  const handleStockMovement = async (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: Omit<StockMovement, 'id'> = {
      ...movementData,
      createdAt: new Date().toISOString()
    }
    
    await addStockMovement(newMovement)
    
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Productos con Bajo Stock</CardTitle>
                <p className="text-sm text-muted-foreground">Muestra los productos con stock por debajo del mínimo configurado</p>
              </div>
              {lowStockProducts.length > 0 && (
                <Badge className="bg-red-600 text-white">{lowStockProducts.length} productos</Badge>
              )}
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  Todo el inventario está por encima del mínimo.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Stock actual</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Déficit</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => {
                      const deficit = product.minStock - product.currentStock
                      const isCritical = product.currentStock <= product.minStock * 0.5
                      return (
                        <TableRow key={product.id} className={isCritical ? 'bg-red-50/60' : 'bg-yellow-50/40'}>
                          <TableCell>
                            <div className="font-semibold">{product.name}</div>
                            <p className="text-xs text-muted-foreground">{product.category} · {product.unit}</p>
                          </TableCell>
                          <TableCell className="text-right font-mono">{product.currentStock}</TableCell>
                          <TableCell className="text-right font-mono">{product.minStock}</TableCell>
                          <TableCell className="text-right font-mono">{deficit > 0 ? deficit : 0}</TableCell>
                          <TableCell>
                            <Badge className={isCritical ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}>
                              {isCritical ? 'Crítico' : 'Bajo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleAdjustStock(product, 'entry')}>
                              Entrada
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAdjustStock(product, 'exit')}>
                              Salida
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
