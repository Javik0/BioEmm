import { StockMovement } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUp, ArrowDown, ArrowsClockwise, ClockCounterClockwise } from '@phosphor-icons/react'

interface StockHistoryProps {
  movements: StockMovement[]
  productFilter?: string
}

export function StockHistory({ movements, productFilter }: StockHistoryProps) {
  const filteredMovements = productFilter
    ? movements.filter(m => m.productId === productFilter)
    : movements

  const sortedMovements = [...filteredMovements].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry': return <ArrowUp size={20} weight="bold" className="text-green-600" />
      case 'exit': return <ArrowDown size={20} weight="bold" className="text-red-600" />
      case 'adjustment': return <ArrowsClockwise size={20} weight="bold" className="text-blue-600" />
    }
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'entry': return <Badge className="bg-green-100 text-green-800">Entrada</Badge>
      case 'exit': return <Badge className="bg-red-100 text-red-800">Salida</Badge>
      case 'adjustment': return <Badge className="bg-blue-100 text-blue-800">Ajuste</Badge>
    }
  }

  if (sortedMovements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClockCounterClockwise size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground mb-2">No hay movimientos registrados</p>
          <p className="text-sm text-muted-foreground">
            Los movimientos de stock aparecerán aquí
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockCounterClockwise size={24} weight="duotone" />
          Historial de Movimientos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {sortedMovements.map((movement) => (
              <div 
                key={movement.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getMovementIcon(movement.type)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{movement.productName}</p>
                        {getMovementBadge(movement.type)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {movement.reason}
                      </p>
                      
                      {movement.relatedTo?.reference && (
                        <p className="text-sm text-muted-foreground">
                          Ref: {movement.relatedTo.reference}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString('es-EC', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className={`text-lg font-bold font-mono ${
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </p>
                    
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Anterior: {movement.previousStock}</p>
                      <p className="font-semibold text-foreground">
                        Nuevo: {movement.newStock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
