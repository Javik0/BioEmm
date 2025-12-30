import { Order } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface OrderListProps {
  orders: Order[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function OrderList({ orders }: OrderListProps) {
  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Aún no hay órdenes registradas.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Órdenes recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[520px] pr-4">
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold">{order.clientName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">{order.status}</Badge>
                    {order.paymentStatus && <Badge>{order.paymentStatus}</Badge>}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`} className="flex justify-between">
                      <span>{item.productName}</span>
                      <span className="font-mono">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <p className="text-xs text-muted-foreground">Nota: {order.notes}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
