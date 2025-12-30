import { useState } from 'react'
import { Client, Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface OrderItemInput {
  productId: string
  presentationId?: string
  quantity: number
}

interface OrderFormProps {
  clients: Client[]
  products: Product[]
  loading?: boolean
  onSubmit: (data: {
    clientId: string
    orderDate: string
    items: OrderItemInput[]
    notes?: string
  }) => Promise<void>
}

export function OrderForm({ clients, products, onSubmit, loading }: OrderFormProps) {
  const preferredClient = typeof window !== 'undefined' ? sessionStorage.getItem('ordersPreferredClientId') || '' : ''
  const [clientId, setClientId] = useState(preferredClient)
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<OrderItemInput[]>([{ productId: '', presentationId: '', quantity: 0 }])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleItemChange = (index: number, field: keyof OrderItemInput, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item))
    )
  }

  const addItemRow = () => setItems((prev) => [...prev, { productId: '', presentationId: '', quantity: 0 }])

  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      toast.error('Selecciona un cliente')
      return
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto con cantidad')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ clientId, orderDate, items: validItems, notes: notes.trim() || undefined })
      setItems([{ productId: '', presentationId: '', quantity: 0 }])
      setNotes('')
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crear orden / venta</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de la orden</Label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Productos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                Agregar producto
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-lg p-3 bg-muted/30">
                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">Producto</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => {
                        handleItemChange(index, 'productId', value)
                        const prod = products.find((p) => p.id === value)
                        if (prod?.presentations?.length) {
                          handleItemChange(index, 'presentationId', prod.presentations[0].id)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => {
                          const totalStock = product.presentations?.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0) ?? product.currentStock
                          return (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({totalStock} {product.unit})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">Presentación</Label>
                    <Select
                      value={item.presentationId || ''}
                      onValueChange={(value) => handleItemChange(index, 'presentationId', value)}
                      disabled={!products.find((p) => p.id === item.productId)?.presentations?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona presentación" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .find((p) => p.id === item.productId)?.presentations?.map((pres) => (
                            <SelectItem key={pres.id} value={pres.id}>
                              {pres.label} · PVP ${pres.pvp.toFixed(2)} · Stock {pres.stock?.current ?? 0}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs text-muted-foreground">Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItemRow(index)} disabled={items.length === 1}>
                      Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones, referencia, condiciones de pago" rows={3} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || submitting}>
              {submitting ? 'Guardando...' : 'Crear y descontar stock'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
