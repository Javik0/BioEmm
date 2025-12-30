import { Client } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Envelope, Trash, Flask, Image as ImageIcon, UserMinus, UserPlus } from '@phosphor-icons/react'

interface ClientListProps {
  clients: Client[]
  onClientClick: (client: Client) => void
  onDeleteClient: (clientId: string) => void
  onCreateDosification: (client: Client) => void
  onLocateClient?: (client: Client) => void
  onReactivateClient?: (client: Client) => void
  onPermanentDelete?: (client: Client) => void
}

export function ClientList({ clients, onClientClick, onDeleteClient, onCreateDosification, onLocateClient, onReactivateClient, onPermanentDelete }: ClientListProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      'Prospecto': 'bg-yellow-100 text-yellow-800',
      'Activo': 'bg-green-100 text-green-800',
      'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/D'
    return new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
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
        <Card key={client.id} className="hover:shadow-lg transition-shadow group overflow-hidden">
          {client.photos && client.photos.length > 0 && (
            <div className="relative h-40 overflow-hidden bg-muted">
              <img
                src={client.photos[0].url}
                alt={client.photos[0].description || client.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {client.photos.length > 1 && (
                <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                  <ImageIcon size={14} className="mr-1" weight="fill" />
                  {client.photos.length}
                </Badge>
              )}
            </div>
          )}
          
          <CardContent className="p-6">
            <div onClick={() => onClientClick(client)} className="cursor-pointer">
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
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex flex-wrap gap-1">
                    <span className="font-medium text-primary/80">Creado</span>
                    <span className="truncate">{client.createdBy || 'N/D'} · {formatDateTime(client.createdAt)}</span>
                  </div>
                  {client.updatedAt && (
                    <div className="flex flex-wrap gap-1">
                      <span className="font-medium text-amber-700">Editado</span>
                      <span className="truncate">{client.updatedBy || 'N/D'} · {formatDateTime(client.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {client.status === 'Inactivo' ? (
                // Botones para clientes inactivos
                <>
                  {onReactivateClient && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => onReactivateClient(client)}
                    >
                      <UserPlus className="mr-1" size={16} />
                      Reactivar
                    </Button>
                  )}

                  {onPermanentDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onPermanentDelete(client)}
                    >
                      <Trash size={16} />
                      Eliminar
                    </Button>
                  )}
                </>
              ) : (
                // Botones para clientes activos/prospectos
                <>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => onCreateDosification(client)}
                  >
                    <Flask className="mr-1" size={16} />
                    Dosificar
                  </Button>

                  {onLocateClient && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLocateClient(client)}
                      disabled={!client.location}
                      title={client.location ? 'Ver en mapa' : 'Cliente sin ubicación'}
                    >
                      <MapPin size={16} weight="fill" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={() => onDeleteClient(client.id)}
                    title="Desactivar cliente"
                  >
                    <UserMinus size={16} />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
