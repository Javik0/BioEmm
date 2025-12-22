import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Client, CropType, ClientStatus, ClientPhoto, CROP_TYPES, AgricultureType, ApplicationMode, AGRICULTURE_TYPES, APPLICATION_MODES, CropCategory, CROP_CATEGORIES } from '@/types'
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
  Crosshair,
  Camera,
  Trash,
  Image as ImageIcon,
  UploadSimple,
  CaretUpDown,
  Check
} from '@phosphor-icons/react'
import { LocationPicker } from '@/components/LocationPicker'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  const [cropType, setCropType] = useState<CropType>('Otro')
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
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [photos, setPhotos] = useState<ClientPhoto[]>([])
  const [photoDescription, setPhotoDescription] = useState('')
  const [cropTypeOpen, setCropTypeOpen] = useState(false)
  const [agricultureType, setAgricultureType] = useState<AgricultureType | undefined>(undefined)
  const [applicationMode, setApplicationMode] = useState<ApplicationMode | undefined>(undefined)
  const [cropCategory, setCropCategory] = useState<CropCategory | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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
      setPhotos(editClient.photos || [])
      setAgricultureType(editClient.agricultureType)
      setApplicationMode(editClient.applicationMode)
      setCropCategory(editClient.cropCategory)
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
      preferredContactMethod,
      photos: photos.length > 0 ? photos : undefined,
      agricultureType,
      applicationMode,
      cropCategory
    })

    resetForm()
  }

  const resetForm = () => {
    setName('')
    setContact('')
    setPhone('')
    setEmail('')
    setCropType('Otro')
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
    setLocationPickerOpen(false)
    setActiveTab('basic')
    setPhotos([])
    setPhotoDescription('')
    setAgricultureType(undefined)
    setApplicationMode(undefined)
    setCropCategory(undefined)
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
            lat: parseFloat(position.coords.latitude.toFixed(8)),
            lng: parseFloat(position.coords.longitude.toFixed(8))
          }
          setLocation(newLocation)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileCount = files.length
    let processedCount = 0

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande. Máximo 5MB por imagen`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const newPhoto: ClientPhoto = {
          id: Date.now().toString() + Math.random(),
          url: reader.result as string,
          fileName: file.name,
          description: photoDescription || undefined,
          uploadedAt: new Date().toISOString()
        }
        setPhotos((current) => [...current, newPhoto])
        processedCount++
        
        if (processedCount === fileCount) {
          if (fileCount === 1) {
            toast.success(`Foto "${file.name}" agregada`)
          } else {
            toast.success(`${fileCount} fotos agregadas correctamente`)
          }
          setPhotoDescription('')
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (photo && confirm(`¿Eliminar foto "${photo.fileName}"?`)) {
      setPhotos((current) => current.filter(p => p.id !== photoId))
      toast.success('Foto eliminada')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-0.5">
              <TabsTrigger value="basic" className="flex items-center gap-1 text-xs md:text-sm px-2">
                <User size={14} />
                <span className="hidden md:inline">Básica</span>
                <span className="md:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-1 text-xs md:text-sm px-2">
                <MapPin size={14} />
                <span className="hidden md:inline">Ubicación</span>
                <span className="md:hidden">Ubicación</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-1 text-xs md:text-sm px-2">
                <Camera size={14} />
                <span className="hidden md:inline">Fotos</span>
                <span className="md:hidden">Fotos</span>
                {photos.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {photos.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-1 text-xs md:text-sm px-2">
                <Buildings size={14} />
                <span className="hidden md:inline">Adicional</span>
                <span className="md:hidden">Más</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 mt-4">
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
                    <Label htmlFor="cropCategory" className="flex items-center gap-2">
                      <Palette size={16} />
                      Cultivo
                    </Label>
                    <Select
                      value={cropCategory || ''}
                      onValueChange={(value) => setCropCategory(value as CropCategory)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CROP_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cropType" className="flex items-center gap-2">
                      <Palette size={16} />
                      Tipo de Cultivo *
                    </Label>
                    <Popover open={cropTypeOpen} onOpenChange={setCropTypeOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={cropTypeOpen}
                          className="w-full justify-between mt-1.5 font-normal"
                        >
                          {cropType || "Seleccionar cultivo..."}
                          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cultivo..." className="h-9" />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>No se encontró el cultivo.</CommandEmpty>
                            <CommandGroup>
                              {CROP_TYPES.map((crop) => (
                                <CommandItem
                                  key={crop}
                                  value={crop}
                                  onSelect={() => {
                                    setCropType(crop as CropType)
                                    setCropTypeOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      cropType === crop ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {crop}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

                  <div>
                    <Label htmlFor="agricultureType" className="flex items-center gap-2">
                      <Palette size={16} />
                      Tipo de Agricultura
                    </Label>
                    <Select
                      value={agricultureType || ''}
                      onValueChange={(value) => setAgricultureType(value as AgricultureType)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AGRICULTURE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="applicationMode" className="flex items-center gap-2">
                      <Palette size={16} />
                      Modo de Aplicación
                    </Label>
                    <Select
                      value={applicationMode || ''}
                      onValueChange={(value) => setApplicationMode(value as ApplicationMode)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-3 mt-4">
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
                    variant="default"
                    onClick={() => setLocationPickerOpen(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MapPin className="mr-2" weight="fill" />
                    Seleccionar Ubicación en Mapa
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

                {!location && (
                  <div className="text-center py-8 text-muted-foreground text-sm bg-white rounded-lg border-2 border-dashed border-accent/30">
                    <MapPin size={48} className="mx-auto mb-3 opacity-30" weight="duotone" />
                    <p>Haz clic en "Seleccionar Ubicación en Mapa" para agregar coordenadas GPS precisas</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-3 mt-4">
              <Card className="p-5 bg-accent/5 border-accent/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-accent flex items-center gap-2">
                    <Camera size={18} weight="duotone" />
                    Fotos del Terreno / Cultivo
                  </h3>
                  <Badge variant="secondary" className="font-mono">
                    {photos.length} foto{photos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo-description" className="mb-2 block">
                      Descripción de la foto (opcional)
                    </Label>
                    <Input
                      id="photo-description"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                      placeholder="Ej: Vista general del cultivo, Sistema de riego, Invernadero..."
                      className="mb-3"
                    />
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                      id="camera-capture"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full h-24 bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 border-2 border-accent/30 shadow-lg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={36} weight="duotone" className="text-white" />
                          <span className="text-sm font-semibold text-white">Tomar Foto</span>
                          <span className="text-xs text-white/90">
                            Abrir cámara
                          </span>
                        </div>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-dashed border-2 h-24 hover:bg-primary/5 hover:border-primary"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <UploadSimple size={32} weight="duotone" className="text-primary" />
                          <span className="text-sm font-medium">Seleccionar Fotos</span>
                          <span className="text-xs text-muted-foreground">
                            Desde galería
                          </span>
                        </div>
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Formatos: JPG, PNG, GIF - Máximo 5MB por imagen
                    </p>
                  </div>

                  {photos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon size={64} className="mx-auto mb-4 opacity-20" weight="duotone" />
                      <p className="text-sm">
                        No hay fotos agregadas aún
                      </p>
                      <p className="text-xs mt-1">
                        Agrega imágenes del terreno, cultivos o instalaciones
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-accent transition-colors">
                          <img
                            src={photo.url}
                            alt={photo.description || photo.fileName}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              {photo.description && (
                                <p className="text-white text-xs font-medium mb-2 line-clamp-2">
                                  {photo.description}
                                </p>
                              )}
                              <p className="text-white/70 text-xs truncate mb-2">
                                {photo.fileName}
                              </p>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="w-full h-8"
                              >
                                <Trash size={14} className="mr-1" weight="bold" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {photos.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <ImageIcon size={18} weight="duotone" />
                    Las fotos se guardarán con el cliente y podrás verlas en su ficha de información
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="additional" className="space-y-3 mt-4">
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

          <Separator className="my-3" />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-[100px]">
              Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 min-w-[120px]">
              {editClient ? '✓ Actualizar Cliente' : '+ Guardar Cliente'}
            </Button>
          </DialogFooter>
        </form>

        <LocationPicker
          open={locationPickerOpen}
          onOpenChange={setLocationPickerOpen}
          onLocationSelect={(newLocation) => {
            setLocation(newLocation)
            toast.success('Ubicación seleccionada correctamente')
          }}
          initialLocation={location}
        />
      </DialogContent>
    </Dialog>
  )
}
