import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client, Dosification, DosificationProduct, Product } from '@/types'
import { Plus, Trash, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DosificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dosification: Omit<Dosification, 'id' | 'date'>) => void
  client?: Client
  products: Product[]
}

export function DosificationForm({ open, onOpenChange, onSubmit, client, products: inventoryProducts }: DosificationFormProps) {
  const [hectares, setHectares] = useState(client?.hectares.toString() || '')
  const [products, setProducts] = useState<DosificationProduct[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (client) {
      setHectares(client.hectares.toString())
    }
  }, [client])

  const addProduct = () => {
    setProducts([
      ...products,
      { productId: '', productName: '', quantity: 0, unit: 'kg' }
    ])
  }

  const updateProduct = (index: number, field: keyof DosificationProduct, value: string | number) => {
    const updated = [...products]
    updated[index] = { ...updated[index], [field]: value }
    setProducts(updated)
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const getProductStock = (productId: string) => {
    const product = inventoryProducts.find(p => p.id === productId)
    return product?.currentStock || 0
  }

  const hasStockIssues = () => {
    return products.some(p => {
      if (!p.productId) return false
      const availableStock = getProductStock(p.productId)
      return p.quantity > availableStock
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!client) {
      toast.error('No hay cliente seleccionado')
      return
    }

    const hectaresNum = parseFloat(hectares)
    if (isNaN(hectaresNum) || hectaresNum <= 0) {
      toast.error('Las hectáreas deben ser un número válido')
      return
    }

    if (products.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    const invalidProducts = products.filter(p => !p.productName || p.quantity <= 0 || !p.productId)
    if (invalidProducts.length > 0) {
      toast.error('Completa todos los productos correctamente')
      return
    }

    if (hasStockIssues()) {
      toast.error('Algunos productos no tienen stock suficiente. Revisa las cantidades.')
      return
    }

    onSubmit({
      clientId: client.id,
      clientName: client.name,
      hectares: hectaresNum,
      cropType: client.cropType,
      products,
      notes: notes || undefined,
      status: 'Pendiente'
    })

    resetForm()
  }

  const resetForm = () => {
    setHectares(client?.hectares.toString() || '')
    setProducts([])
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const calculateTotalPerHa = (quantity: number) => {
    const ha = parseFloat(hectares) || 1
    return (quantity / ha).toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nueva Dosificación</DialogTitle>
          {client && (
            <p className="text-sm text-muted-foreground">
              Cliente: <span className="font-semibold">{client.name}</span> • {client.cropType}
            </p>
          )}
        </DialogHeader>

        {inventoryProducts.length === 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <WarningCircle size={32} weight="fill" className="text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">No hay productos en el inventario</p>
                  <p className="text-sm text-yellow-700">
                    Agrega productos al inventario antes de crear dosificaciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="hectares">Hectáreas a Aplicar</Label>
            <Input
              id="hectares"
              type="number"
              step="0.1"
              value={hectares}
              onChange={(e) => setHectares(e.target.value)}
              placeholder="Ej: 15.5"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Productos a Aplicar</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                <Plus className="mr-1" size={16} />
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-3">
              {products.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">No hay productos agregados</p>
                    <p className="text-xs">Haz clic en "Agregar Product o" para comenzar</p>
                  </CardContent>
                </Card>
              ) : (
                products.map((product, index) => {
                  const inventoryProduct = inventoryProducts.find(p => p.id === product.productId)
                  const availableStock = inventoryProduct?.currentStock || 0
                  const hasStock = product.productId && product.quantity <= availableStock
                  const stockWarning = product.productId && product.quantity > availableStock

                  return (
                    <Card key={index} className={stockWarning ? 'border-red-300 bg-red-50' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Producto {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                          >
                            <Trash size={16} />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label className="text-xs">Producto del Inventario</Label>
                            <Select
                              value={product.productId}
                              onValueChange={(productId) => {
                                const selected = inventoryProducts.find(p => p.id === productId)
                                if (selected) {
                                  updateProduct(index, 'productId', productId)
                                  updateProduct(index, 'productName', selected.name)
                                  updateProduct(index, 'unit', selected.unit)
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryProducts.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>{p.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        Stock: {p.currentStock} {p.unit}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Cantidad Total</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={product.quantity || ''}
                              onChange={(e) => updateProduct(index, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Unidad</Label>
                            <Input
                              value={product.unit}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>

                        {product.productId && (
                          <div className={`p-2 rounded text-xs flex items-center justify-between ${
                            stockWarning ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'
                          }`}>
                            <div className="flex items-center gap-2">
                              {stockWarning ? (
                                <WarningCircle size={16} weight="fill" className="text-red-600" />
                              ) : (
                                <CheckCircle size={16} weight="fill" className="text-green-600" />
                              )}
                              <span className={stockWarning ? 'text-red-700 font-medium' : 'text-green-700'}>
                                {stockWarning 
                                  ? `Stock insuficiente (Disponible: ${availableStock} ${product.unit})`
                                  : `Stock disponible: ${availableStock} ${product.unit}`
                                }
                              </span>
                            </div>
                          </div>
                        )}

                        {product.quantity > 0 && hectares && (
                          <div className="bg-muted p-2 rounded text-xs">
                            <span className="text-muted-foreground">Dosis por hectárea: </span>
                            <span className="font-mono font-semibold">
                              {calculateTotalPerHa(product.quantity)} {product.unit}/ha
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones, condiciones especiales, etc..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-accent hover:bg-accent/90"
              disabled={inventoryProducts.length === 0}
            >
              Guardar Dosificación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
