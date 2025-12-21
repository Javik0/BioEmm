import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client, CropType, ClientStatus } from '@/types'
import { MapPin, X } from '@phosphor-icons/react'
import { SimpleMap } from './SimpleMap'
import { toast } from 'sonner'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (client: Omit<Client, 'id' | 'createdAt'>) => void
  editClient?: Client
}

export function ClientForm({ open, onOpenChange, onSubmit, editClient }: ClientFormProps) {
  const [name, setName] = useState(editClient?.name || '')
  const [contact, setContact] = useState(editClient?.contact || '')
  const [phone, setPhone] = useState(editClient?.phone || '')
  const [email, setEmail] = useState(editClient?.email || '')
  const [cropType, setCropType] = useState<CropType>(editClient?.cropType || 'Flores')
  const [hectares, setHectares] = useState(editClient?.hectares.toString() || '')
  const [status, setStatus] = useState<ClientStatus>(editClient?.status || 'Prospecto')
  const [notes, setNotes] = useState(editClient?.notes || '')
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(editClient?.location)
  const [showMap, setShowMap] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !contact || !phone || !hectares) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    const hectaresNum = parseFloat(hectares)
    if (isNaN(hectaresNum) || hectaresNum <= 0) {
      toast.error('Las hectáreas deben ser un número válido mayor a 0')
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
      location
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
    setShowMap(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre del Cliente *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Finca Las Rosas"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact">Persona de Contacto *</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 0991234567"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div>
              <Label htmlFor="cropType">Tipo de Cultivo *</Label>
              <Select value={cropType} onValueChange={(v) => setCropType(v as CropType)}>
                <SelectTrigger id="cropType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flores">Flores</SelectItem>
                  <SelectItem value="Hortalizas">Hortalizas</SelectItem>
                  <SelectItem value="Frutas">Frutas</SelectItem>
                  <SelectItem value="Granos">Granos</SelectItem>
                  <SelectItem value="Tubérculos">Tubérculos</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hectares">Hectáreas *</Label>
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

            <div className="col-span-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospecto">Prospecto</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Ubicación GPS</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={location ? "default" : "outline"}
                  onClick={() => setShowMap(!showMap)}
                  className="flex-1"
                >
                  <MapPin className="mr-2" />
                  {location 
                    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : 'Seleccionar en mapa'
                  }
                </Button>
                {location && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation(undefined)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>

            {showMap && (
              <div className="col-span-2">
                <SimpleMap
                  clients={[]}
                  selectedLocation={location}
                  onMapClick={(lat, lng) => {
                    setLocation({ lat, lng })
                    toast.success('Ubicación seleccionada')
                  }}
                />
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional sobre el cliente..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              {editClient ? 'Actualizar' : 'Guardar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
