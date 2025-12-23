import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientPhoto } from '@/types'
import { 
  Camera, 
  Trash, 
  Image as ImageIcon, 
  UploadSimple,
  PencilSimple,
  X,
  FloppyDisk,
  ImageSquare,
  Spinner,
  Warning
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { uploadClientPhoto, deleteClientPhoto, isStorageUrl } from '@/features/clients/services/storageService'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PhotoManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: ClientPhoto[]
  onUpdatePhotos: (photos: ClientPhoto[]) => void
  clientName: string
  clientId: string
}

export function PhotoManager({ open, onOpenChange, photos, onUpdatePhotos, clientName, clientId }: PhotoManagerProps) {
  const [localPhotos, setLocalPhotos] = useState<ClientPhoto[]>(photos)
  const [photoDescription, setPhotoDescription] = useState('')
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<ClientPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newPhotos: ClientPhoto[] = []
    let successCount = 0
    let errorCount = 0

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        errorCount++
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande. Máximo 5MB por imagen`)
        errorCount++
        continue
      }

      const photoId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

      try {
        // Subir a Firebase Storage
        const downloadURL = await uploadClientPhoto(file, clientId, photoId)
        
        const newPhoto: ClientPhoto = {
          id: photoId,
          url: downloadURL,
          fileName: file.name,
          description: photoDescription || undefined,
          uploadedAt: new Date().toISOString()
        }
        newPhotos.push(newPhoto)
        successCount++
      } catch (error) {
        console.error('Error subiendo foto:', error)
        toast.error(`Error al subir "${file.name}"`)
        errorCount++
      }
    }

    if (newPhotos.length > 0) {
      setLocalPhotos((current) => [...current, ...newPhotos])
      if (successCount === 1) {
        toast.success(`Foto subida correctamente`)
      } else {
        toast.success(`${successCount} fotos subidas correctamente`)
      }
      setPhotoDescription('')
    }
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    const photo = localPhotos.find(p => p.id === photoId)
    if (photo) {
      setPhotoToDelete(photo)
      setDeleteDialogOpen(true)
    }
  }

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return
    
    // Si es una URL de Storage, eliminar del storage
    if (isStorageUrl(photoToDelete.url)) {
      try {
        await deleteClientPhoto(photoToDelete.url)
      } catch (error) {
        console.warn('No se pudo eliminar del storage:', error)
      }
    }
    setLocalPhotos((current) => current.filter(p => p.id !== photoToDelete.id))
    toast.success('Foto eliminada')
    setDeleteDialogOpen(false)
    setPhotoToDelete(null)
  }

  const handleEditDescription = (photoId: string) => {
    const photo = localPhotos.find(p => p.id === photoId)
    if (photo) {
      setEditingPhotoId(photoId)
      setEditDescription(photo.description || '')
    }
  }

  const handleSaveDescription = (photoId: string) => {
    setLocalPhotos((current) =>
      current.map((p) =>
        p.id === photoId ? { ...p, description: editDescription || undefined } : p
      )
    )
    setEditingPhotoId(null)
    setEditDescription('')
    toast.success('Descripción actualizada')
  }

  const handleSave = () => {
    onUpdatePhotos(localPhotos)
    toast.success('Fotos actualizadas correctamente')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalPhotos(photos)
    setPhotoDescription('')
    setEditingPhotoId(null)
    setEditDescription('')
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <ImageSquare size={28} weight="duotone" />
              Gestionar Fotos - {clientName}
            </DialogTitle>
            <DialogDescription>
              Agrega, elimina o actualiza las fotos del terreno y cultivo del cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="p-5 bg-accent/5 border-accent/20">
              <h3 className="font-semibold text-sm text-accent mb-4 flex items-center gap-2">
                <UploadSimple size={18} weight="duotone" />
                Agregar Nuevas Fotos
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo-description" className="text-sm">
                    Descripción (opcional)
                  </Label>
                  <Input
                    id="photo-description"
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    placeholder="Ej: Vista panorámica del cultivo, Sistema de riego, etc."
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta descripción se aplicará a todas las fotos que subas a continuación
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-w-[200px]"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Spinner size={18} className="mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <UploadSimple size={18} className="mr-2" weight="bold" />
                        Seleccionar Archivos
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 min-w-[200px] bg-accent/10 border-accent/30 hover:bg-accent/20"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Spinner size={18} className="mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera size={18} className="mr-2" weight="bold" />
                        Tomar Foto
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: JPG, PNG, WEBP. Tamaño máximo: 5MB por imagen. Puedes seleccionar múltiples fotos.
                </p>
              </div>
            </Card>

            {localPhotos.length > 0 ? (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ImageIcon size={18} weight="duotone" />
                    Fotos Actuales ({localPhotos.length})
                  </h3>
                  <Badge variant="secondary">
                    {localPhotos.length} foto{localPhotos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localPhotos.map((photo, index) => (
                    <Card key={photo.id} className="overflow-hidden border-2 hover:border-accent/50 transition-all">
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.description || photo.fileName}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 opacity-90 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id)
                            }}
                          >
                            <Trash size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {photo.fileName}
                        </p>
                        
                        {editingPhotoId === photo.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Agregar descripción..."
                              className="text-sm min-h-[60px]"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveDescription(photo.id)}
                                className="flex-1"
                              >
                                <FloppyDisk size={14} className="mr-1" />
                                Guardar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPhotoId(null)
                                  setEditDescription('')
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground line-clamp-2 flex-1">
                              {photo.description || (
                                <span className="text-muted-foreground italic">Sin descripción</span>
                              )}
                            </p>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleEditDescription(photo.id)}
                            >
                              <PencilSimple size={14} weight="bold" />
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.uploadedAt).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <ImageIcon size={64} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-lg text-muted-foreground mb-2">No hay fotos agregadas</p>
                <p className="text-sm text-muted-foreground">
                  Usa los botones de arriba para agregar fotos del terreno o cultivo
                </p>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} className="bg-accent hover:bg-accent/90">
              <FloppyDisk size={16} className="mr-2" weight="bold" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedPhotoIndex !== null && localPhotos[selectedPhotoIndex] && (
        <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon size={24} weight="duotone" />
                {localPhotos[selectedPhotoIndex].description || localPhotos[selectedPhotoIndex].fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={localPhotos[selectedPhotoIndex].url}
                alt={localPhotos[selectedPhotoIndex].description || localPhotos[selectedPhotoIndex].fileName}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Foto {selectedPhotoIndex + 1} de {localPhotos.length}
                  {localPhotos[selectedPhotoIndex].uploadedAt && (
                    <span className="ml-2">
                      • Subida el {new Date(localPhotos[selectedPhotoIndex].uploadedAt).toLocaleDateString('es-EC')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Warning size={24} weight="fill" />
              ¿Eliminar foto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la foto <strong>{photoToDelete?.fileName}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPhotoToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePhoto} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                  {selectedPhotoIndex > 0 && (
                    <Button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                      variant="secondary"
                    >
                      ← Anterior
                    </Button>
                  )}
                  {selectedPhotoIndex < localPhotos.length - 1 && (
                    <Button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                      variant="secondary"
                    >
                      Siguiente →
                    </Button>
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
