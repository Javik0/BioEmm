import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Client, CropType, ClientStatus } from '@/types'
import { 
  MapPin, 
  X, 
  User, 
  Phone, 
  EnvelopeSimple, 
  MapTrifold, 
  Buildings,
  Palette,
  CurrencyDollar,
  ChatText,
  IdentificationCard,
  Crosshair
} from '@phosphor-icons/react'
import { SimpleMap } from './SimpleMap'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (client: Omit<Client, 'id' | 'createdAt'>) => void
  editClient?: Client
}

export function ClientForm({ open, onOpenChange, onSubmit, editClient }: ClientFormProps) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cropType, setCropType] = useState<CropType>('Flores')
  const [hectares, setHectares] = useState('')
  const [status, setStatus] = useState<ClientStatus>('Prospecto')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>()
  const [address, setAddress] = useState('')
  const [ruc, setRuc] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState<'phone' | 'email' | 'whatsapp'>('phone')
  const [showMap, setShowMap] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (editClient) {
      setName(editClient.name)
      setContact(editClient.contact)
      setPhone(editClient.phone)
      setEmail(editClient.email || '')
      setCropType(editClient.cropType)
      setHectares(editClient.hectares.toString())
      setStatus(editClient.status)
      setNotes(editClient.notes || '')
      setLocation(editClient.location)
      setAddress(editClient.address || '')
      setRuc(editClient.ruc || '')
      setRegion(editClient.region || '')
      setCity(editClient.city || '')
      setPaymentTerms(editClient.paymentTerms || '')
      setPreferredContactMethod(editClient.preferredContactMethod || 'phone')
    }
  }, [editClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !contact || !phone || !hectares) {
      toast.error('Por favor completa los campos requeridos: Nombre, Contacto, Teléfono y Hectáreas')
      setActiveTab('basic')
      return
    }

    const hectaresNum = parseFloat(hectares)
    if (isNaN(hectaresNum) || hectaresNum <= 0) {
      toast.error('Las hectáreas deben ser un número válido mayor a 0')
      setActiveTab('basic')
      return
    }

    onSubmit({
      name,
      contact,
      phone,
      email: email || undefined,
      cropType,
      hectares: hectaresNum,
      status,
      notes: notes || undefined,
      location,
      address: address || undefined,
      ruc: ruc || undefined,
      region: region || undefined,
      city: city || undefined,
      paymentTerms: paymentTerms || undefined,
      preferredContactMethod
    })

    resetForm()
  }

  const resetForm = () => {
    setName('')
    setContact('')
    setPhone('')
    setEmail('')
    setCropType('Flores')
    setHectares('')
    setStatus('Prospecto')
    setNotes('')
    setLocation(undefined)
    setAddress('')
    setRuc('')
    setRegion('')
    setCity('')
    setPaymentTerms('')
    setPreferredContactMethod('phone')
    setShowMap(false)
    setActiveTab('basic')
  }

  const handleClose = () => {
    if (!editClient) {
      resetForm()
    }
    onOpenChange(false)
  }

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      toast.info('Obteniendo ubicación actual...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setLocation(newLocation)
          setShowMap(true)
          toast.success('Ubicación GPS obtenida correctamente')
        },
        (error) => {
          toast.error('No se pudo obtener la ubicación GPS: ' + error.message)
        }
      )
    } else {
      toast.error('Tu navegador no soporta geolocalización')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <User size={28} weight="duotone" />
            {editClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {editClient 
              ? 'Modifica los datos del cliente en el sistema'
              : 'Completa la información del nuevo cliente agrícola'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User size={16} />
                <span className="hidden sm:inline">Información Básica</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin size={16} />
                <span className="hidden sm:inline">Ubicación</span>
                <span className="sm:hidden">Ubicación</span>
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Buildings size={16} />
                <span className="hidden sm:inline">Datos Adicionales</span>
                <span className="sm:hidden">Adicional</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-5 mt-6">
              <Card className="p-5 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                  <User size={18} weight="duotone" />
                  Datos del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Buildings size={16} />
                      Nombre del Cliente / Finca *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Finca Las Rosas"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact" className="flex items-center gap-2">
                      <User size={16} />
                      Persona de Contacto *
                    </Label>
                    <Input
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ruc" className="flex items-center gap-2">
                      <IdentificationCard size={16} />
                      RUC / Cédula
                    </Label>
                    <Input
                      id="ruc"
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value)}
                      placeholder="Ej: 1234567890001"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="flex items-center gap-2">
                      <Palette size={16} />
                      Estado del Cliente
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                      <SelectTrigger id="status" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prospecto">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-3 h-3 p-0 bg-yellow-500"></Badge>
                            Prospecto
                          </div>
                        </SelectItem>
                        <SelectItem value="Activo">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-3 h-3 p-0 bg-green-500"></Badge>
                            Activo
                          </div>
                        </SelectItem>
                        <SelectItem value="Inactivo">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-3 h-3 p-0 bg-gray-500"></Badge>
                            Inactivo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-secondary/5 border-secondary/20">
                <h3 className="font-semibold text-sm text-secondary mb-4 flex items-center gap-2">
                  <Phone size={18} weight="duotone" />
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone size={16} />
                      Teléfono *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 0991234567"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <EnvelopeSimple size={16} />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <ChatText size={16} />
                      Método de Contacto Preferido
                    </Label>
                    <Select value={preferredContactMethod} onValueChange={(v) => setPreferredContactMethod(v as any)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Teléfono</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-accent/5 border-accent/20">
                <h3 className="font-semibold text-sm text-accent mb-4 flex items-center gap-2">
                  <MapTrifold size={18} weight="duotone" />
                  Datos del Cultivo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cropType" className="flex items-center gap-2">
                      <Palette size={16} />
                      Tipo de Cultivo *
                    </Label>
                    <Select value={cropType} onValueChange={(v) => setCropType(v as CropType)}>
                      <SelectTrigger id="cropType" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Flores">🌹 Flores</SelectItem>
                        <SelectItem value="Hortalizas">🥬 Hortalizas</SelectItem>
                        <SelectItem value="Frutas">🍓 Frutas</SelectItem>
                        <SelectItem value="Granos">🌾 Granos</SelectItem>
                        <SelectItem value="Tubérculos">🥔 Tubérculos</SelectItem>
                        <SelectItem value="Otro">🌱 Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="hectares" className="flex items-center gap-2">
                      <MapTrifold size={16} />
                      Hectáreas *
                    </Label>
                    <Input
                      id="hectares"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={hectares}
                      onChange={(e) => setHectares(e.target.value)}
                      placeholder="Ej: 15.5"
                      className="mt-1.5 font-mono"
                      required
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-5 mt-6">
              <Card className="p-5 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                  <MapPin size={18} weight="duotone" />
                  Dirección
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Dirección Completa</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Av. Principal Km 5, vía a Cayambe"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">Provincia / Región</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Ej: Pichincha"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ciudad / Cantón</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Cayambe"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-accent/5 border-accent/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-accent flex items-center gap-2">
                    <Crosshair size={18} weight="duotone" />
                    Coordenadas GPS
                  </h3>
                  {location && (
                    <Badge className="bg-green-600 font-mono text-xs">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant={showMap ? "default" : "outline"}
                    onClick={() => setShowMap(!showMap)}
                    className="flex-1"
                  >
                    <MapPin className="mr-2" weight={showMap ? "fill" : "regular"} />
                    {showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGetCurrentLocation}
                    className="flex-1"
                  >
                    <Crosshair className="mr-2" weight="bold" />
                    Mi Ubicación Actual
                  </Button>
                  {location && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLocation(undefined)}
                      className="shrink-0"
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>

                {showMap && (
                  <div className="rounded-lg overflow-hidden border-2 border-accent/30 shadow-lg">
                    <SimpleMap
                      clients={[]}
                      selectedLocation={location}
                      onMapClick={(lat, lng) => {
                        setLocation({ lat, lng })
                        toast.success('Ubicación GPS seleccionada correctamente')
                      }}
                    />
                  </div>
                )}

                {!showMap && !location && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <MapPin size={48} className="mx-auto mb-3 opacity-30" weight="duotone" />
                    <p>Haz clic en "Seleccionar en Mapa" para agregar coordenadas GPS</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-5 mt-6">
              <Card className="p-5 bg-secondary/5 border-secondary/20">
                <h3 className="font-semibold text-sm text-secondary mb-4 flex items-center gap-2">
                  <CurrencyDollar size={18} weight="duotone" />
                  Información Comercial
                </h3>
                <div>
                  <Label htmlFor="paymentTerms">Términos de Pago</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ej: 30 días, Contado, 15 días"
                    className="mt-1.5"
                  />
                </div>
              </Card>

              <Card className="p-5 bg-muted/50">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <ChatText size={18} weight="duotone" />
                  Notas y Observaciones
                </h3>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega información adicional, observaciones o detalles importantes sobre el cliente..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Puedes incluir detalles sobre el tipo de cultivos, necesidades especiales, historial, etc.
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-[100px]">
              Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 min-w-[120px]">
              {editClient ? '✓ Actualizar Cliente' : '+ Guardar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
