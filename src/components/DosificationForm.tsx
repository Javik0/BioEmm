import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client, Dosification, DosificationProduct } from '@/types'
import { Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DosificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dosification: Omit<Dosification, 'id' | 'date'>) => void
  client?: Client
}

const COMMON_PRODUCTS = [
  { name: 'Fertilizante NPK 10-30-10', unit: 'kg' },
  { name: 'Urea 46%', unit: 'kg' },
  { name: 'Sulfato de Amonio', unit: 'kg' },
  { name: 'Superfosfato Triple', unit: 'kg' },
  { name: 'Cloruro de Potasio', unit: 'kg' },
  { name: 'Micronutrientes Foliares', unit: 'L' },
  { name: 'Fungicida Sistémico', unit: 'L' },
  { name: 'Insecticida Contacto', unit: 'L' },
  { name: 'Herbicida Selectivo', unit: 'L' },
  { name: 'Bioestimulante', unit: 'L' },
]

export function DosificationForm({ open, onOpenChange, onSubmit, client }: DosificationFormProps) {
  const [hectares, setHectares] = useState(client?.hectares.toString() || '')
  const [products, setProducts] = useState<DosificationProduct[]>([])
  const [notes, setNotes] = useState('')

  const addProduct = () => {
    setProducts([
      ...products,
      { productId: Date.now().toString(), productName: '', quantity: 0, unit: 'kg' }
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

    const invalidProducts = products.filter(p => !p.productName || p.quantity <= 0)
    if (invalidProducts.length > 0) {
      toast.error('Completa todos los productos correctamente')
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
                    <p className="text-xs">Haz clic en "Agregar Producto" para comenzar</p>
                  </CardContent>
                </Card>
              ) : (
                products.map((product, index) => (
                  <Card key={product.productId}>
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
                          <Label className="text-xs">Nombre del Producto</Label>
                          <Select
                            value={product.productName}
                            onValueChange={(v) => {
                              const selected = COMMON_PRODUCTS.find(p => p.name === v)
                              updateProduct(index, 'productName', v)
                              if (selected) {
                                updateProduct(index, 'unit', selected.unit)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_PRODUCTS.map((p) => (
                                <SelectItem key={p.name} value={p.name}>
                                  {p.name}
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
                            onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                            placeholder="kg, L"
                          />
                        </div>
                      </div>

                      {product.quantity > 0 && hectares && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <span className="font-mono font-semibold">
                            {calculateTotalPerHa(product.quantity)} {product.unit}/ha
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
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
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              Guardar Dosificación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
