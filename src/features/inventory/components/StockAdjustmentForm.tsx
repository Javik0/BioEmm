import { useState, useEffect } from 'react'
import { Product, StockMovement } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp, ArrowDown, ArrowsClockwise } from '@phosphor-icons/react'

import { toast } from 'sonner'

interface StockAdjustmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  type: 'entry' | 'exit' | 'adjustment'
  onSubmit: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void
}

export function StockAdjustmentForm({ open, onOpenChange, product, type, onSubmit }: StockAdjustmentFormProps) {
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')

  useEffect(() => {
    if (open) {
      setQuantity(0)
      setReason('')
      setReference('')
    }
  }, [open])

  if (!product) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const adjustedQuantity = type === 'exit' ? -Math.abs(quantity) : Math.abs(quantity)
    const newStock = product.currentStock + adjustedQuantity
    if (newStock < 0) {
      toast.error('El stock no puede ser negativo')
      return
    }

    onSubmit({
      productId: product.id,
      productName: product.name,
      type,
      quantity: adjustedQuantity,
      previousStock: product.currentStock,
      newStock,
      reason,
      relatedTo: reference ? {
        type: 'manual',
        reference
      } : undefined
    })

    onOpenChange(false)
  }

  const getIcon = () => {
    switch (type) {
      case 'entry': return <ArrowUp size={24} weight="duotone" className="text-green-600" />
      case 'exit': return <ArrowDown size={24} weight="duotone" className="text-red-600" />
      case 'adjustment': return <ArrowsClockwise size={24} weight="duotone" className="text-blue-600" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'entry': return 'Entrada de Stock'
      case 'exit': return 'Salida de Stock'
      case 'adjustment': return 'Ajuste de Stock'
    }
  }

  const newStock = type === 'exit' 
    ? product.currentStock - Math.abs(quantity)
    : product.currentStock + Math.abs(quantity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock Actual:</span>
                <span className="font-mono font-semibold">
                  {product.currentStock} {product.unit}
                </span>
              </div>
              
              {quantity > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Nuevo Stock:</span>
                  <span className={`font-mono font-bold ${
                    newStock < 0 ? 'text-red-600' :
                    newStock <= product.minStock ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {newStock} {product.unit}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Cantidad {type === 'exit' ? 'a retirar' : 'a agregar'} *
            </Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="font-mono"
                required
              />
              <div className="flex items-center px-3 bg-muted rounded-md text-sm font-medium min-w-[60px] justify-center">
                {product.unit}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {type === 'entry' && (
                  <>
                    <SelectItem value="Compra a proveedor">Compra a proveedor</SelectItem>
                    <SelectItem value="Devolución de cliente">Devolución de cliente</SelectItem>
                    <SelectItem value="Ajuste de inventario">Ajuste de inventario</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </>
                )}
                {type === 'exit' && (
                  <>
                    <SelectItem value="Venta a cliente">Venta a cliente</SelectItem>
                    <SelectItem value="Dosificación aplicada">Dosificación aplicada</SelectItem>
                    <SelectItem value="Producto vencido">Producto vencido</SelectItem>
                    <SelectItem value="Pérdida o daño">Pérdida o daño</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </>
                )}
                {type === 'adjustment' && (
                  <>
                    <SelectItem value="Corrección de inventario">Corrección de inventario</SelectItem>
                    <SelectItem value="Conteo físico">Conteo físico</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia / Notas</Label>
            <Textarea
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número de factura, nombre del cliente, observaciones..."
              rows={3}
            />
          </div>

          {newStock < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <strong>Advertencia:</strong> El stock no puede ser negativo. Ajusta la cantidad.
            </div>
          )}

          {newStock >= 0 && newStock <= product.minStock && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Alerta:</strong> El nuevo stock estará por debajo del mínimo recomendado ({product.minStock} {product.unit}).
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={newStock < 0 || quantity <= 0 || !reason}
              className={
                type === 'entry' ? 'bg-green-600 hover:bg-green-700' :
                type === 'exit' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              Confirmar {type === 'entry' ? 'Entrada' : type === 'exit' ? 'Salida' : 'Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
