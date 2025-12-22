import { Client, ClientPhoto, Dosification } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PhotoManager } from '@/components/PhotoManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  PencilSimple,
  ImageSquare,
  Flask,
  Calendar,
  ClockCounterClockwise,
  Info
} from '@phosphor-icons/react'
import { useState } from 'react'

interface ClientDetailProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (client: Client) => void
  onUpdatePhotos?: (clientId: string, photos: ClientPhoto[]) => void
  dosifications?: Dosification[]
}

export function ClientDetail({ client, open, onOpenChange, onEdit, onUpdatePhotos, dosifications = [] }: ClientDetailProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false)

  if (!client) return null

  const clientDosifications = dosifications.filter(d => d.clientId === client.id)
  const appliedDosifications = clientDosifications.filter(d => d.status === 'Aplicada' || d.status === 'Completada')
  const pendingDosifications = clientDosifications.filter(d => d.status === 'Pendiente')

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

  const handleUpdatePhotos = (photos: ClientPhoto[]) => {
    if (onUpdatePhotos) {
      onUpdatePhotos(client.id, photos)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2 mb-2">
                  <Buildings size={28} weight="duotone" />
                  {client.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                  {clientDosifications.length > 0 && (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      <Flask size={14} className="mr-1" weight="fill" />
                      {clientDosifications.length} dosificacion{clientDosifications.length !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              {onEdit && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <PencilSimple size={16} className="mr-2" weight="bold" />
                  Editar Cliente
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info size={16} />
                Información
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <ImageIcon size={16} />
                Fotos {client.photos && client.photos.length > 0 && `(${client.photos.length})`}
              </TabsTrigger>
              <TabsTrigger value="dosifications" className="flex items-center gap-2">
                <ClockCounterClockwise size={16} />
                Historial {clientDosifications.length > 0 && `(${clientDosifications.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 mt-6">
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
            </TabsContent>

            <TabsContent value="photos" className="space-y-6 mt-6">
              <Card className="p-5 bg-accent/5 border-accent/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-accent flex items-center gap-2">
                    <ImageIcon size={18} weight="duotone" />
                    Fotos del Terreno / Cultivo {client.photos && client.photos.length > 0 && `(${client.photos.length})`}
                  </h3>
                  {onUpdatePhotos && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPhotoManagerOpen(true)}
                      className="border-accent/30 hover:bg-accent/10"
                    >
                      <ImageSquare size={16} className="mr-2" weight="bold" />
                      Gestionar Fotos
                    </Button>
                  )}
                </div>
                
                {client.photos && client.photos.length > 0 ? (
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
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No hay fotos del terreno o cultivo
                    </p>
                    {onUpdatePhotos && (
                      <Button
                        size="sm"
                        onClick={() => setPhotoManagerOpen(true)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <ImageSquare size={16} className="mr-2" weight="bold" />
                        Agregar Fotos
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="dosifications" className="space-y-6 mt-6">
              {clientDosifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Flask size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg text-muted-foreground mb-2">No hay dosificaciones registradas</p>
                    <p className="text-sm text-muted-foreground">
                      Las dosificaciones aplicadas a este cliente aparecerán aquí
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {appliedDosifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <Flask size={18} weight="duotone" />
                        Dosificaciones Aplicadas ({appliedDosifications.length})
                      </h3>
                      <div className="space-y-3">
                        {appliedDosifications
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((dosification) => (
                            <Card key={dosification.id} className="border-l-4 border-l-green-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar size={16} className="text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        {new Date(dosification.date).toLocaleDateString('es-EC', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <MapTrifold size={14} />
                                        {dosification.hectares} ha
                                      </span>
                                      <span>•</span>
                                      <span>{dosification.cropType}</span>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-600">
                                    {dosification.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">Productos Aplicados:</p>
                                  {dosification.products.map((product, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex justify-between items-center text-sm p-2 rounded bg-muted"
                                    >
                                      <span className="font-medium">{product.productName}</span>
                                      <span className="font-mono font-semibold text-primary">
                                        {product.quantity} {product.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {dosification.notes && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-muted-foreground">{dosification.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}

                  {pendingDosifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                        <ClockCounterClockwise size={18} weight="duotone" />
                        Dosificaciones Pendientes ({pendingDosifications.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingDosifications
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((dosification) => (
                            <Card key={dosification.id} className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar size={16} className="text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        {new Date(dosification.date).toLocaleDateString('es-EC', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <MapTrifold size={14} />
                                        {dosification.hectares} ha
                                      </span>
                                      <span>•</span>
                                      <span>{dosification.cropType}</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    {dosification.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">Productos a Aplicar:</p>
                                  {dosification.products.map((product, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex justify-between items-center text-sm p-2 rounded bg-white border"
                                    >
                                      <span className="font-medium">{product.productName}</span>
                                      <span className="font-mono font-semibold text-primary">
                                        {product.quantity} {product.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {dosification.notes && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-muted-foreground">{dosification.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

      {onUpdatePhotos && (
        <PhotoManager
          open={photoManagerOpen}
          onOpenChange={setPhotoManagerOpen}
          photos={client.photos || []}
          onUpdatePhotos={handleUpdatePhotos}
          clientName={client.name}
        />
      )}
    </>
  )
}
