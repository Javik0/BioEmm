import { useState, useEffect } from 'react'
import { Product, ProductCategory, ProductPresentation, ProductUnit } from '@/types'
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
    costPerUnit: undefined as number | undefined,
    supplier: '',
    sku: '',
    notes: ''
  })

  const createEmptyPresentation = (unit: ProductUnit): ProductPresentation => ({
    id: `pres-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: '',
    unit,
    pvp: 0,
    discounts: undefined,
    stock: { current: 0, min: 0, max: undefined },
    sku: '',
    notes: ''
  })

  const [presentations, setPresentations] = useState<ProductPresentation[]>([createEmptyPresentation('L')])

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name,
        category: editProduct.category,
        unit: editProduct.unit,
        costPerUnit: editProduct.costPerUnit,
        supplier: editProduct.supplier || '',
        sku: editProduct.sku || '',
        notes: editProduct.notes || ''
      })

      const hasPresentations = Array.isArray(editProduct.presentations) && editProduct.presentations.length > 0
      setPresentations(
        hasPresentations
          ? editProduct.presentations.map((p) => ({
              ...p,
              stock: {
                current: p.stock?.current ?? 0,
                min: p.stock?.min ?? 0,
                max: p.stock?.max
              }
            }))
          : [createEmptyPresentation(editProduct.unit)]
      )
    } else {
      setFormData({
        name: '',
        category: 'Fertilizante',
        unit: 'L',
        costPerUnit: undefined,
        supplier: '',
        sku: '',
        notes: ''
      })
      setPresentations([createEmptyPresentation('L')])
    }
  }, [editProduct, open])

  const handlePresentationChange = (id: string, updater: (prev: ProductPresentation) => ProductPresentation) => {
    setPresentations((prev) => prev.map((p) => (p.id === id ? updater(p) : p)))
  }

  const addPresentation = () => {
    setPresentations((prev) => [...prev, createEmptyPresentation(formData.unit)])
  }

  const removePresentation = (id: string) => {
    setPresentations((prev) => (prev.length === 1 ? prev : prev.filter((p) => p.id !== id)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validPresentations = presentations.filter((p) => p.label.trim() && p.pvp > 0)
    if (validPresentations.length === 0) {
      alert('Agrega al menos una presentación con P.V.P mayor a 0')
      return
    }

    const withDiscounts = validPresentations.map((p) => ({
      ...p,
      discounts: {
        d10: +(p.pvp * 0.9).toFixed(2),
        d15: +(p.pvp * 0.85).toFixed(2),
        d20: +(p.pvp * 0.8).toFixed(2),
        d25: +(p.pvp * 0.75).toFixed(2),
        d35: +(p.pvp * 0.65).toFixed(2),
      },
      stock: {
        current: p.stock?.current ?? 0,
        min: p.stock?.min ?? 0,
        max: p.stock?.max,
      }
    }))

    const currentStockSum = withDiscounts.reduce((acc, p) => acc + (p.stock.current || 0), 0)
    const minStockSum = withDiscounts.reduce((acc, p) => acc + (p.stock.min || 0), 0)
    const maxStockSum = withDiscounts.every((p) => p.stock.max == null)
      ? undefined
      : withDiscounts.reduce((acc, p) => acc + (p.stock.max || 0), 0)

    onSubmit({
      ...formData,
      costPerUnit: formData.costPerUnit || undefined,
      supplier: formData.supplier || undefined,
      sku: formData.sku || undefined,
      notes: formData.notes || undefined,
      presentations: withDiscounts,
      currentStock: currentStockSum,
      minStock: minStockSum,
      maxStock: maxStockSum,
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
                placeholder="Ej: NODOSUM"
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
              <Label htmlFor="unit">Unidad base *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => {
                  const asUnit = value as ProductUnit
                  setFormData({ ...formData, unit: asUnit })
                  // sync default unit to newly added presentations
                  setPresentations((prev) => prev.map((p) => ({ ...p, unit: p.unit || asUnit })))
                }}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Litros (L)</SelectItem>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="cc">Centímetros cúbicos (cc)</SelectItem>
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
                placeholder="Marca / proveedor"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Presentaciones (stock y P.V.P)</h3>
              <Button type="button" variant="outline" size="sm" onClick={addPresentation}>
                Agregar presentación
              </Button>
            </div>

            <div className="space-y-3">
              {presentations.map((p) => (
                <div key={p.id} className="border rounded-md p-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>Etiqueta *</Label>
                      <Input
                        value={p.label}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Ej: 20L, 500cc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidad</Label>
                      <Select
                        value={p.unit}
                        onValueChange={(value) => handlePresentationChange(p.id, (prev) => ({ ...prev, unit: value as ProductUnit }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="cc">cc</SelectItem>
                          <SelectItem value="unidades">unidades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>P.V.P *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.pvp || ''}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, pvp: parseFloat(e.target.value) || 0 }))}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU presentación</Label>
                      <Input
                        value={p.sku || ''}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, sku: e.target.value }))}
                        placeholder="Opcional"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Stock actual *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.stock?.current ?? 0}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, stock: { ...prev.stock, current: parseFloat(e.target.value) || 0 } }))}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock mínimo *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.stock?.min ?? 0}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, stock: { ...prev.stock, min: parseFloat(e.target.value) || 0 } }))}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock máximo</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.stock?.max ?? ''}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, stock: { ...prev.stock, max: e.target.value ? parseFloat(e.target.value) : undefined } }))}
                        className="font-mono"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="w-full pr-4">
                      <Label>Notas de presentación</Label>
                      <Input
                        value={p.notes || ''}
                        onChange={(e) => handlePresentationChange(p.id, (prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ej: promo, empaque, etc"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePresentation(p.id)} disabled={presentations.length === 1}>
                      Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">INFORMACIÓN ADICIONAL</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Costo de referencia ($)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerUnit || ''}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Opcional"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones, composición, etc."
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
