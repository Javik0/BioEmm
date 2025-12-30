import { Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  PencilSimple, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  WarningCircle,
  CheckCircle 
} from '@phosphor-icons/react'

interface ProductListProps {
  products: Product[]
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  onAdjustStock: (product: Product, type: 'entry' | 'exit') => void
}

export function ProductList({ products, onEditProduct, onDeleteProduct, onAdjustStock }: ProductListProps) {
  const aggregateStock = (product: Product) => {
    if (product.presentations?.length) {
      const current = product.presentations.reduce((sum, p) => sum + (p.stock?.current ?? 0), 0)
      const min = product.presentations.reduce((sum, p) => sum + (p.stock?.min ?? 0), 0)
      const max = product.presentations.every((p) => p.stock?.max == null)
        ? undefined
        : product.presentations.reduce((sum, p) => sum + (p.stock?.max ?? 0), 0)
      return { current, min, max }
    }
    return { current: product.currentStock, min: product.minStock, max: product.maxStock }
  }

  const getStockStatus = (product: Product): 'critical' | 'low' | 'normal' | 'high' => {
    const { current, min, max } = aggregateStock(product)
    if (current <= min * 0.5) return 'critical'
    if (current <= min) return 'low'
    if (max && current >= max) return 'high'
    return 'normal'
  }

  const getStockPercentage = (product: Product): number => {
    const { current, min, max } = aggregateStock(product)
    const maxValue = max || min * 3 || 1
    return Math.min((current / maxValue) * 100, 100)
  }

  const getStockColor = (status: string): string => {
    switch (status) {
      case 'critical': return 'text-red-600'
      case 'low': return 'text-yellow-600'
      case 'high': return 'text-blue-600'
      default: return 'text-green-600'
    }
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Fertilizante': return 'bg-green-100 text-green-800'
      case 'Insecticida': return 'bg-red-100 text-red-800'
      case 'Fungicida': return 'bg-purple-100 text-purple-800'
      case 'Herbicida': return 'bg-orange-100 text-orange-800'
      case 'Bioestimulante': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    const statusOrder = { critical: 0, low: 1, normal: 2, high: 3 }
    const aStatus = getStockStatus(a)
    const bStatus = getStockStatus(b)
    
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus]
    }
    
    return a.name.localeCompare(b.name)
  })

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground mb-2">No hay productos registrados</p>
          <p className="text-sm text-muted-foreground">
            Comienza agregando productos a tu inventario
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedProducts.map((product) => {
        const status = getStockStatus(product)
        const percentage = getStockPercentage(product)
        
        return (
          <Card key={product.id} className={status === 'critical' ? 'border-red-300 bg-red-50/30' : status === 'low' ? 'border-yellow-300 bg-yellow-50/30' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge className={getCategoryColor(product.category)}>
                      {product.category}
                    </Badge>
                  </div>
                  
                  {product.sku && (
                    <p className="text-sm text-muted-foreground font-mono">
                      SKU: {product.sku}
                    </p>
                  )}
                  
                  {product.supplier && (
                    <p className="text-sm text-muted-foreground">
                      Proveedor: {product.supplier}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditProduct(product)}
                  >
                    <PencilSimple size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    <Trash size={18} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold font-mono ${getStockColor(status)}`}>
                      {aggregateStock(product).current}
                    </span>
                    <span className="text-sm text-muted-foreground">{product.unit}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stock Mínimo</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-muted-foreground">
                      {aggregateStock(product).min}
                    </span>
                    <span className="text-sm text-muted-foreground">{product.unit}</span>
                  </div>
                </div>

                {aggregateStock(product).max && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Stock Máximo</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-muted-foreground">
                        {aggregateStock(product).max}
                      </span>
                      <span className="text-sm text-muted-foreground">{product.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nivel de stock</span>
                  <span className={`font-semibold ${getStockColor(status)}`}>
                    {status === 'critical' && (
                      <span className="flex items-center gap-1">
                        <WarningCircle weight="fill" size={16} />
                        ¡Stock Crítico!
                      </span>
                    )}
                    {status === 'low' && (
                      <span className="flex items-center gap-1">
                        <WarningCircle weight="fill" size={16} />
                        Stock Bajo
                      </span>
                    )}
                    {status === 'normal' && (
                      <span className="flex items-center gap-1">
                        <CheckCircle weight="fill" size={16} />
                        Stock Normal
                      </span>
                    )}
                    {status === 'high' && (
                      <span className="flex items-center gap-1">
                        Stock Alto
                      </span>
                    )}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    status === 'critical' ? '[&>div]:bg-red-600' :
                    status === 'low' ? '[&>div]:bg-yellow-600' :
                    status === 'high' ? '[&>div]:bg-blue-600' :
                    '[&>div]:bg-green-600'
                  }`}
                />
              </div>

              {product.presentations?.length ? (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Presentaciones</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {product.presentations.map((p) => (
                      <div key={p.id} className="border rounded-md p-2 bg-white">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{p.label}</span>
                          <Badge variant="outline">{p.unit}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>P.V.P</span>
                          <span className="font-mono font-semibold">${p.pvp.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>Stock</span>
                          <span className="font-mono font-semibold">{p.stock?.current ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                product.costPerUnit && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo por unidad:</span>
                      <span className="font-mono font-semibold">${product.costPerUnit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Valor total en stock:</span>
                      <span className="font-mono font-semibold text-primary">
                        ${(product.currentStock * product.costPerUnit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAdjustStock(product, 'entry')}
                  className="flex-1"
                >
                  <ArrowUp size={16} className="mr-1" weight="bold" />
                  Entrada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAdjustStock(product, 'exit')}
                  className="flex-1"
                >
                  <ArrowDown size={16} className="mr-1" weight="bold" />
                  Salida
                </Button>
              </div>

              {product.notes && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-muted-foreground">{product.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
