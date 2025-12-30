import { useEffect, useMemo, useState } from 'react'
import { useClients } from '@/features/clients'
import { useProducts } from '@/features/products'
import { useOrders } from '@/features/orders'
import { useStockMovements } from '@/features/inventory'
import { Order, OrderItem } from '@/types'
import { OrderForm, OrderList } from '@/features/orders'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Users as UsersIcon, ClipboardText, ClockCounterClockwise, CheckCircle } from '@phosphor-icons/react'

export default function OrdersPage() {
  const { clients: clientsList } = useClients()
  const { products: productsList, upsertProduct } = useProducts()
  const { orders, addOrder, updateOrder } = useOrders()
  const { addStockMovement } = useStockMovements()
  const [saving, setSaving] = useState(false)
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'Todos' | Order['status']>('Todos')

  useEffect(() => {
    const storedClient = sessionStorage.getItem('ordersPreferredClientId')
    if (storedClient) {
      setClientFilter(storedClient)
    }
  }, [])

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => clientFilter === 'all' || o.clientId === clientFilter)
      .filter((o) => statusFilter === 'Todos' || o.status === statusFilter)
  }, [orders, clientFilter, statusFilter])

  const stats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const pending = orders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length
    return { total, delivered, pending }
  }, [orders])

  const handleCreateOrder = async (data: { clientId: string; orderDate: string; items: { productId: string; presentationId?: string; quantity: number }[]; notes?: string }) => {
    const client = clientsList.find((c) => c.id === data.clientId)
    if (!client) {
      toast.error('Cliente no encontrado')
      return
    }

    if (!productsList || productsList.length === 0) {
      toast.error('No hay productos cargados')
      return
    }

    // Validar stock disponible
    for (const item of data.items) {
      const product = productsList.find((p) => p.id === item.productId)
      if (!product) {
        toast.error('Producto no encontrado')
        return
      }
      if (item.quantity <= 0) {
        toast.error('La cantidad debe ser mayor a 0')
        return
      }

      const presentation = product.presentations?.find((p) => p.id === item.presentationId)
      if (product.presentations?.length) {
        if (!presentation) {
          toast.error(`Selecciona una presentación para ${product.name}`)
          return
        }
        if ((presentation.stock?.current ?? 0) - item.quantity < 0) {
          toast.error(`Stock insuficiente para ${product.name} (${presentation.label})`)
          return
        }
      } else {
        if (product.currentStock - item.quantity < 0) {
          toast.error(`Stock insuficiente para ${product.name}`)
          return
        }
      }
    }

    setSaving(true)
    const now = new Date().toISOString()
    const orderDateISO = data.orderDate ? new Date(data.orderDate).toISOString() : now

    try {
      const items: OrderItem[] = data.items.map((item) => {
        const product = productsList.find((p) => p.id === item.productId)!
        const presentation = product.presentations?.find((p) => p.id === item.presentationId)
        const unitToUse = presentation?.unit || product.unit
        return {
          productId: product.id,
          productName: product.name,
          presentationId: presentation?.id,
          presentationLabel: presentation?.label,
          unit: unitToUse,
          quantity: item.quantity,
          unitPrice: presentation?.pvp,
          lineTotal: presentation ? +(presentation.pvp * item.quantity).toFixed(2) : undefined
        }
      })

      const orderPayload: Omit<Order, 'id'> = {
        clientId: client.id,
        clientName: client.name,
        status: 'delivered',
        paymentStatus: 'pending',
        orderDate: orderDateISO,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
        items,
      }

      const orderId = await addOrder(orderPayload)

      // Generar movimientos y actualizar stock
      for (const item of items) {
        const product = productsList.find((p) => p.id === item.productId)!
        const presentation = product.presentations?.find((p) => p.id === item.presentationId)

        if (presentation) {
          const newPresentationStock = (presentation.stock?.current ?? 0) - item.quantity
          const updatedPresentations = product.presentations!.map((p) =>
            p.id === presentation.id
              ? { ...p, stock: { ...p.stock, current: newPresentationStock } }
              : p
          )
          const aggregatedCurrent = updatedPresentations.reduce((acc, p) => acc + (p.stock?.current ?? 0), 0)
          const aggregatedMin = updatedPresentations.reduce((acc, p) => acc + (p.stock?.min ?? 0), 0)
          const aggregatedMax = updatedPresentations.every((p) => p.stock?.max == null)
            ? undefined
            : updatedPresentations.reduce((acc, p) => acc + (p.stock?.max ?? 0), 0)

          const ok = await addStockMovement({
            productId: product.id,
            productName: product.name,
            presentationId: presentation.id,
            presentationLabel: presentation.label,
            type: 'exit',
            quantity: item.quantity,
            previousStock: presentation.stock?.current ?? 0,
            newStock: newPresentationStock,
            reason: 'Venta a cliente',
            clientId: client.id,
            clientName: client.name,
            relatedTo: { type: 'order', id: orderId, reference: orderId },
            createdAt: now,
          })

          if (!ok) {
            toast.error('No se pudo registrar el movimiento de stock')
            return
          }

          await upsertProduct({
            ...product,
            presentations: updatedPresentations,
            currentStock: aggregatedCurrent,
            minStock: aggregatedMin,
            maxStock: aggregatedMax,
          })
        } else {
          const newStock = product.currentStock - item.quantity

          const ok = await addStockMovement({
            productId: product.id,
            productName: product.name,
            type: 'exit',
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock,
            reason: 'Venta a cliente',
            clientId: client.id,
            clientName: client.name,
            relatedTo: { type: 'order', id: orderId, reference: orderId },
            createdAt: now,
          })

          if (!ok) {
            toast.error('No se pudo registrar el movimiento de stock')
            return
          }

          await upsertProduct({ ...product, currentStock: newStock })
        }
      }

      // Actualizar orden con marca de actualizado
      await updateOrder({ ...orderPayload, id: orderId, updatedAt: new Date().toISOString() })

      toast.success('Orden creada y stock actualizado')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear la orden')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardText size={18} />
              Órdenes Totales
            </CardTitle>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Histórico de órdenes registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-600" />
              Entregadas
            </CardTitle>
            <Badge className="bg-emerald-600 text-white">{stats.delivered}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Órdenes marcadas como entregadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClockCounterClockwise size={18} className="text-amber-600" />
              Pendientes
            </CardTitle>
            <Badge className="bg-amber-600 text-white">{stats.pending}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Borradores o confirmadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Package size={16} />
            Crear orden
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <UsersIcon size={16} />
            Listado
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2 hidden md:flex">
            <ClipboardText size={16} />
            Filtros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Crear orden / venta</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderForm clients={clientsList} products={productsList || []} onSubmit={handleCreateOrder} loading={saving} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtros rápidos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clientsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Estado</p>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="delivered">Entregada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                    <SelectItem value="returned">Devuelta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <OrderList orders={filteredOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
