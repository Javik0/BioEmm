import { Client } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Phone, 
  EnvelopeSimple, 
  MapPin, 
  Buildings,
  MapTrifold,
  IdentificationCard,
  CurrencyDollar,
  ChatText,
  Crosshair,
  Image as ImageIcon,
  PencilSimple
} from '@phosphor-icons/react'
import { useState } from 'react'

interface ClientDetailProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (client: Client) => void
}

export function ClientDetail({ client, open, onOpenChange, onEdit }: ClientDetailProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  if (!client) return null

  const getStatusColor = (status: string) => {
    const colors = {
      'Prospecto': 'bg-yellow-100 text-yellow-800',
      'Activo': 'bg-green-100 text-green-800',
      'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(client)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2 mb-2">
                  <Buildings size={28} weight="duotone" />
                  {client.name}
                </DialogTitle>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
              {onEdit && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <PencilSimple size={16} className="mr-2" weight="bold" />
                  Editar Cliente
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {client.photos && client.photos.length > 0 && (
              <Card className="p-5 bg-accent/5 border-accent/20">
                <h3 className="font-semibold text-sm text-accent mb-4 flex items-center gap-2">
                  <ImageIcon size={18} weight="duotone" />
                  Fotos del Terreno / Cultivo ({client.photos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {client.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-accent transition-all cursor-pointer"
                      onClick={() => setSelectedPhotoIndex(index)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.description || photo.fileName}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {photo.description && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium line-clamp-2">
                              {photo.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-5 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                <User size={18} weight="duotone" />
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                    <User size={14} />
                    Persona de Contacto
                  </label>
                  <p className="font-medium">{client.contact}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                    <Phone size={14} />
                    Teléfono
                  </label>
                  <p className="font-medium font-mono">{client.phone}</p>
                </div>
                {client.email && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <EnvelopeSimple size={14} />
                      Email
                    </label>
                    <p className="font-medium">{client.email}</p>
                  </div>
                )}
                {client.ruc && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <IdentificationCard size={14} />
                      RUC / Cédula
                    </label>
                    <p className="font-medium font-mono">{client.ruc}</p>
                  </div>
                )}
                {client.preferredContactMethod && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <ChatText size={14} />
                      Método de Contacto Preferido
                    </label>
                    <p className="font-medium capitalize">{client.preferredContactMethod}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 bg-secondary/5 border-secondary/20">
              <h3 className="font-semibold text-sm text-secondary mb-4 flex items-center gap-2">
                <MapTrifold size={18} weight="duotone" />
                Información del Cultivo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de Cultivo</label>
                  <p className="font-medium">{client.cropType}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hectáreas</label>
                  <p className="font-medium font-mono text-lg">{client.hectares} ha</p>
                </div>
              </div>
            </Card>

            {(client.address || client.region || client.city || client.location) && (
              <Card className="p-5 bg-muted/50">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <MapPin size={18} weight="duotone" />
                  Ubicación
                </h3>
                <div className="space-y-3">
                  {client.address && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Dirección</label>
                      <p className="font-medium">{client.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.region && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Provincia / Región</label>
                        <p className="font-medium">{client.region}</p>
                      </div>
                    )}
                    {client.city && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Ciudad / Cantón</label>
                        <p className="font-medium">{client.city}</p>
                      </div>
                    )}
                  </div>
                  {client.location && (
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                        <Crosshair size={14} />
                        Coordenadas GPS
                      </label>
                      <p className="font-medium font-mono text-sm">
                        {client.location.lat.toFixed(6)}, {client.location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {client.paymentTerms && (
              <Card className="p-5 bg-muted/50">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <CurrencyDollar size={18} weight="duotone" />
                  Información Comercial
                </h3>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Términos de Pago</label>
                  <p className="font-medium">{client.paymentTerms}</p>
                </div>
              </Card>
            )}

            {client.notes && (
              <Card className="p-5 bg-muted/50">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ChatText size={18} weight="duotone" />
                  Notas y Observaciones
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </Card>
            )}

            <div className="text-xs text-muted-foreground text-center pb-2">
              Cliente registrado el {new Date(client.createdAt).toLocaleDateString('es-EC', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPhotoIndex !== null && client.photos && (
        <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon size={24} weight="duotone" />
                {client.photos[selectedPhotoIndex].description || client.photos[selectedPhotoIndex].fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={client.photos[selectedPhotoIndex].url}
                alt={client.photos[selectedPhotoIndex].description || client.photos[selectedPhotoIndex].fileName}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Foto {selectedPhotoIndex + 1} de {client.photos.length}
                  {client.photos[selectedPhotoIndex].uploadedAt && (
                    <span className="ml-2">
                      • Subida el {new Date(client.photos[selectedPhotoIndex].uploadedAt).toLocaleDateString('es-EC')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedPhotoIndex > 0 && (
                    <button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      ← Anterior
                    </button>
                  )}
                  {selectedPhotoIndex < client.photos.length - 1 && (
                    <button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Siguiente →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
