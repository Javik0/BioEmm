import { Client } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Envelope, Trash, Flask } from '@phosphor-icons/react'

interface ClientListProps {
  clients: Client[]
  onClientClick: (client: Client) => void
  onDeleteClient: (clientId: string) => void
  onCreateDosification: (client: Client) => void
}

export function ClientList({ clients, onClientClick, onDeleteClient, onCreateDosification }: ClientListProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      'Prospecto': 'bg-yellow-100 text-yellow-800',
      'Activo': 'bg-green-100 text-green-800',
      'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">No hay clientes registrados</p>
        <p className="text-sm">Comienza agregando tu primer cliente</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="p-6">
            <div onClick={() => onClientClick(client)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{client.name}</h3>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={16} />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Envelope size={16} />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span className="font-medium">{client.cropType} - {client.hectares} ha</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => onCreateDosification(client)}
              >
                <Flask className="mr-1" size={16} />
                Dosificar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeleteClient(client.id)}
              >
                <Trash size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
