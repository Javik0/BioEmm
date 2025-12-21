import { useState, useEffect } from 'react'
import { Product, ProductCategory, ProductUnit } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Package } from '@phosphor-icons/react'

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (product: Omit<Product, 'id' | 'createdAt'>) => void
  editProduct?: Product
}

export function ProductForm({ open, onOpenChange, onSubmit, editProduct }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fertilizante' as ProductCategory,
    unit: 'L' as ProductUnit,
    currentStock: 0,
    minStock: 0,
    maxStock: undefined as number | undefined,
    costPerUnit: undefined as number | undefined,
    supplier: '',
    sku: '',
    notes: ''
  })

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name,
        category: editProduct.category,
        unit: editProduct.unit,
        currentStock: editProduct.currentStock,
        minStock: editProduct.minStock,
        maxStock: editProduct.maxStock,
        costPerUnit: editProduct.costPerUnit,
        supplier: editProduct.supplier || '',
        sku: editProduct.sku || '',
        notes: editProduct.notes || ''
      })
    } else {
      setFormData({
        name: '',
        category: 'Fertilizante',
        unit: 'L',
        currentStock: 0,
        minStock: 0,
        maxStock: undefined,
        costPerUnit: undefined,
        supplier: '',
        sku: '',
        notes: ''
      })
    }
  }, [editProduct, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      ...formData,
      maxStock: formData.maxStock || undefined,
      costPerUnit: formData.costPerUnit || undefined,
      supplier: formData.supplier || undefined,
      sku: formData.sku || undefined,
      notes: formData.notes || undefined,
      lastRestockDate: editProduct?.lastRestockDate
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package weight="duotone" size={24} className="text-primary" />
            {editProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Fertilizante NPK 15-15-15"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                  <SelectItem value="Insecticida">Insecticida</SelectItem>
                  <SelectItem value="Fungicida">Fungicida</SelectItem>
                  <SelectItem value="Herbicida">Herbicida</SelectItem>
                  <SelectItem value="Bioestimulante">Bioestimulante</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value as ProductUnit })}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Litros (L)</SelectItem>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="unidades">Unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Código interno"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">CONTROL DE STOCK</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Stock Actual *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo *</Label>
                <Input
                  id="minStock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">Alerta cuando caiga debajo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStock">Stock Máximo</Label>
                <Input
                  id="maxStock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxStock || ''}
                  onChange={(e) => setFormData({ ...formData, maxStock: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="font-mono"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">INFORMACIÓN ADICIONAL</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Costo por Unidad ($)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerUnit || ''}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones, instrucciones de uso, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
