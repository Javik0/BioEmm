import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client, Dosification, DosificationProduct, Product } from '@/types'
import { Plus, Trash, WarningCircle, CheckCircle, BookOpen } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDosificationProtocols } from '../hooks/useDosificationProtocols'

interface DosificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dosification: Omit<Dosification, 'id' | 'date'>) => void
  client?: Client
  products: Product[]
  mode?: 'create' | 'edit'
  initialDosification?: Dosification
}

export function DosificationForm({ open, onOpenChange, onSubmit, client, products: inventoryProducts, mode = 'create', initialDosification }: DosificationFormProps) {
  const [hectares, setHectares] = useState(client?.hectares.toString() || '')
  const [products, setProducts] = useState<DosificationProduct[]>([])
  const [notes, setNotes] = useState('')
  
  const { protocols, loading: loadingProtocols } = useDosificationProtocols()
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('')
  const [selectedStageName, setSelectedStageName] = useState<string>('')

  useEffect(() => {
    if (initialDosification) {
      setHectares(initialDosification.hectares.toString())
      setProducts(initialDosification.products)
      setNotes(initialDosification.notes || '')
      return
    }
    if (client) {
      setHectares(client.hectares.toString())
    }
  }, [initialDosification, client])

  const handleLoadStage = (protocolId: string, stageName: string) => {
    const protocol = protocols.find(p => p.id === protocolId)
    if (!protocol) return
  
    const stage = protocol.stages.find(s => s.name === stageName)
    if (!stage) return
  
    const hectaresNum = parseFloat(hectares) || 0
    if (hectaresNum <= 0) {
      toast.error('Ingresa las hectáreas antes de cargar la receta para calcular las cantidades')
      return
    }
  
    const newProducts: DosificationProduct[] = stage.products.map(pp => {
      // Try to find product in inventory
      const inventoryProduct = inventoryProducts.find(ip => 
        ip.name.toLowerCase().trim() === pp.name.toLowerCase().trim() ||
        (ip.code && pp.code && ip.code === pp.code)
      )

      const firstPresentation = inventoryProduct?.presentations?.[0]

      return {
        productId: inventoryProduct?.id || '', 
        productName: pp.name, // Keep original name if not found
        presentationId: firstPresentation?.id,
        presentationLabel: firstPresentation?.label,
        quantity: Number((pp.quantity * hectaresNum).toFixed(2)),
        unit: firstPresentation?.unit || pp.unit || inventoryProduct?.unit || 'kg'
      }
    })
  
    setProducts(newProducts)
    
    const missingProducts = newProducts.filter(p => !p.productId).length
    if (missingProducts > 0) {
      toast.warning(`Receta cargada, pero ${missingProducts} productos no se encontraron en el inventario.`)
    } else {
      toast.success(`Receta cargada: ${stage.name}`)
    }
  }

  const addProduct = () => {
    setProducts([
      ...products,
      { productId: '', productName: '', presentationId: '', quantity: 0, unit: 'kg' }
    ])
  }

  const updateProduct = (index: number, field: keyof DosificationProduct, value: string | number) => {
    setProducts((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const updateProductFields = (index: number, updates: Partial<DosificationProduct>) => {
    setProducts((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const getStockForSelection = (productId: string, presentationId?: string) => {
    const product = inventoryProducts.find(p => p.id === productId)
    if (!product) return { available: 0, unit: '' }

    if (presentationId) {
      const pres = product.presentations?.find((p) => p.id === presentationId)
      if (pres) return { available: pres.stock?.current ?? 0, unit: pres.unit }
    }

    const total = product.presentations?.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0)
    if (product.presentations?.length) return { available: total ?? 0, unit: product.unit }
    return { available: product.currentStock, unit: product.unit }
  }

  const hasStockIssues = () => {
    return products.some(p => {
      if (!p.productId) return false
      const { available } = getStockForSelection(p.productId, p.presentationId)
      return p.quantity > available
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
      status: initialDosification?.status || 'Pendiente'
    })

    resetForm()
  }

  const resetForm = () => {
    if (initialDosification) {
      setHectares(initialDosification.hectares.toString())
      setProducts(initialDosification.products)
      setNotes(initialDosification.notes || '')
      return
    }
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
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{mode === 'edit' ? 'Editar Dosificación' : 'Nueva Dosificación'}</DialogTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mb-2">
              <BookOpen className="text-primary" size={20} />
              <h3 className="font-semibold text-sm">Cargar Protocolo (Receta)</h3>
            </div>
            
            <div>
              <Label className="text-xs">Protocolo</Label>
              <Select
                value={selectedProtocolId}
                onValueChange={(val) => {
                  setSelectedProtocolId(val)
                  setSelectedStageName('')
                }}
                disabled={loadingProtocols}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un protocolo" />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((p) => (
                    <SelectItem key={p.id} value={p.id || ''}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Etapa / Semana</Label>
              <Select
                value={selectedStageName}
                onValueChange={(val) => {
                  setSelectedStageName(val)
                  handleLoadStage(selectedProtocolId, val)
                }}
                disabled={!selectedProtocolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProtocolId && protocols
                    .find(p => p.id === selectedProtocolId)
                    ?.stages.map((stage, idx) => (
                      <SelectItem key={idx} value={stage.name}>
                        {stage.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  const availableData = getStockForSelection(product.productId, product.presentationId)
                  const availableStock = availableData.available
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
                              value={product.productId || ''}
                              onValueChange={(productId) => {
                                const selected = inventoryProducts.find(p => p.id === productId)
                                if (selected) {
                                  const firstPres = selected.presentations?.[0]
                                  updateProductFields(index, {
                                    productId,
                                    productName: selected.name,
                                    presentationId: firstPres?.id || '',
                                    presentationLabel: firstPres?.label,
                                    unit: firstPres?.unit || selected.unit,
                                  })
                                } else {
                                  updateProductFields(index, {
                                    productId: '',
                                    presentationId: '',
                                    presentationLabel: '',
                                  })
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryProducts.map((p) => {
                                  const totalStock = p.presentations?.reduce((acc, pres) => acc + (pres.stock?.current ?? 0), 0) ?? p.currentStock
                                  return (
                                    <SelectItem key={p.id} value={p.id}>
                                      <div className="flex items-center justify-between gap-4">
                                        <span>{p.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Stock: {totalStock} {p.unit}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs">Presentación</Label>
                            <Select
                              value={product.presentationId || ''}
                              onValueChange={(presentationId) => {
                                const selected = inventoryProduct?.presentations?.find((p) => p.id === presentationId)
                                updateProductFields(index, {
                                  presentationId,
                                  presentationLabel: selected?.label,
                                  unit: selected?.unit || product.unit,
                                })
                              }}
                              disabled={!inventoryProduct?.presentations?.length}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={inventoryProduct?.presentations?.length ? 'Selecciona presentación' : 'Sin presentaciones'} />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryProduct?.presentations?.map((pres) => (
                                  <SelectItem key={pres.id} value={pres.id}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>{pres.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        PVP ${pres.pvp.toFixed(2)} · Stock {pres.stock?.current ?? 0} {pres.unit}
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
                            <Input value={product.unit} disabled className="bg-muted" />
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
