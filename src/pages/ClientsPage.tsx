import { useState } from 'react'
import type { Client, ClientPhoto, Dosification, Product, Visit } from '@/types'
import { useClients, ClientForm, ClientList, ClientDetail } from '@/features/clients'
import { useProducts } from '@/features/products'
import { uploadClientPhoto, isBase64Url } from '@/features/clients/services/storageService'
import { DosificationForm, useDosifications } from '@/features/dosifications'
import { useVisits, VisitForm } from '@/features/visits'
import { SimpleMap } from '@/components/SimpleMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, MapTrifold, MagnifyingGlass, Warning, Trash, UserMinus, Users, UsersThree } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useRef } from 'react'

export default function ClientsPage() {
  const { clients: clientsList, upsertClient, deleteClient } = useClients()
  const { dosifications, addDosification } = useDosifications()
  const { products } = useProducts()
  const { visits, addVisit } = useVisits()

  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [clientDetailOpen, setClientDetailOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [dosificationFormOpen, setDosificationFormOpen] = useState(false)
  const [dosificationClient, setDosificationClient] = useState<Client | null>(null)
  const [visitFormOpen, setVisitFormOpen] = useState(false)
  const [visitClient, setVisitClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [focusClient, setFocusClient] = useState<Client | undefined>()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const mapSectionRef = useRef<HTMLDivElement | null>(null)
  
  // Estado para el modal de confirmación de desactivación
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [clientToDeactivate, setClientToDeactivate] = useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const dosificationsList = dosifications || []
  const productsList = products || []
  const visitsList = visits || []

  const normalizeLocation = (location?: Client['location']) => {
    if (!location) return undefined
    const lat = Number(location.lat)
    const lng = Number(location.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
    return {
      lat: parseFloat(lat.toFixed(8)),
      lng: parseFloat(lng.toFixed(8)),
      address: location.address,
    }
  }

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const baseClientData: Omit<Client, 'id' | 'createdAt'> = {
      ...clientData,
      location: normalizeLocation(clientData.location),
    }

    const client: Client = editingClient
      ? { ...baseClientData, id: editingClient.id, createdAt: editingClient.createdAt }
      : { ...baseClientData, id: Date.now().toString(), createdAt: new Date().toISOString() }

    void (async () => {
      try {
        // Subir fotos base64 a Storage antes de guardar
        if (client.photos && client.photos.length > 0) {
          const uploadedPhotos: ClientPhoto[] = []
          for (const photo of client.photos) {
            if (isBase64Url(photo.url)) {
              // Subir a Storage
              try {
                const downloadURL = await uploadClientPhoto(photo.url, client.id, photo.id)
                uploadedPhotos.push({ ...photo, url: downloadURL })
              } catch (uploadErr) {
                console.error('Error subiendo foto:', uploadErr)
                // Mantener la foto base64 si falla la subida
                uploadedPhotos.push(photo)
              }
            } else {
              // Ya es una URL de Storage
              uploadedPhotos.push(photo)
            }
          }
          client.photos = uploadedPhotos
        }

        await upsertClient(client)
        toast.success(
          editingClient
            ? `Cliente ${clientData.name} actualizado correctamente`
            : `Cliente ${clientData.name} agregado correctamente`
        )
        setClientFormOpen(false)
        setEditingClient(undefined)
      } catch (err: any) {
        toast.error(err?.message || 'No se pudo guardar el cliente (Firestore)')
      }
    })()
  }

  const handleDeactivateClient = (clientId: string) => {
    const client = clientsList.find(c => c.id === clientId)
    if (!client) return
    
    // Abrir modal de confirmación
    setClientToDeactivate(client)
    setDeactivateDialogOpen(true)
  }

  const handleRequestPermanentDelete = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const confirmDeactivateClient = async () => {
    if (!clientToDeactivate) return
    
    try {
      // Marcar como inactivo en lugar de eliminar
      await upsertClient({
        ...clientToDeactivate,
        status: 'Inactivo'
      })
      toast.success(`Cliente "${clientToDeactivate.name}" marcado como inactivo`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo desactivar el cliente')
    } finally {
      setDeactivateDialogOpen(false)
      setClientToDeactivate(null)
    }
  }

  const confirmPermanentDelete = async () => {
    if (!clientToDelete) return

    try {
      await deleteClient(clientToDelete.id)
      toast.success(`Cliente "${clientToDelete.name}" eliminado definitivamente`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el cliente')
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  const handleReactivateClient = async (client: Client) => {
    try {
      await upsertClient({
        ...client,
        status: 'Activo'
      })
      toast.success(`Cliente "${client.name}" reactivado correctamente`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo reactivar el cliente')
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientFormOpen(true)
  }

  const handleViewDetail = (client: Client) => {
    setSelectedClient(client)
    setClientDetailOpen(true)
  }

  const handleUpdatePhotos = (clientId: string, photos: ClientPhoto[]) => {
    const client = clientsList.find((c) => c.id === clientId)
    if (!client) return

    void (async () => {
      try {
        await upsertClient({ ...client, photos })
        toast.success('Fotos actualizadas')
      } catch (err: any) {
        toast.error(err?.message || 'No se pudieron guardar las fotos (Firestore)')
      }
    })()
  }

  const openDosificationForm = (client: Client) => {
    setDosificationClient(client)
    setDosificationFormOpen(true)
  }

  const handleCreateDosification = async (dosificationData: Omit<Dosification, 'id' | 'date'>) => {
    const newDosification: Omit<Dosification, 'id'> = {
      ...dosificationData,
      date: new Date().toISOString(),
    }

    const success = await addDosification(newDosification)
    if (success) {
      setDosificationFormOpen(false)
      setDosificationClient(null)
      toast.success('Dosificación registrada correctamente')
    }
  }

  const handleScheduleVisit = async (visitData: Omit<Visit, 'id' | 'createdAt' | 'status'>) => {
    const newVisit: Omit<Visit, 'id'> = {
      ...visitData,
      status: 'Programada',
      createdAt: new Date().toISOString()
    }

    try {
      await addVisit(newVisit)
      setVisitFormOpen(false)
      setVisitClient(null)
      toast.success('Visita programada correctamente')
    } catch (error) {
      toast.error('Error al programar la visita')
    }
  }

  // Filtrar clientes por búsqueda y estado
  const activeClients = clientsList.filter(c => c.status !== 'Inactivo')
  const inactiveClients = clientsList.filter(c => c.status === 'Inactivo')
  
  const baseClients = statusFilter === 'all' 
    ? clientsList 
    : statusFilter === 'inactive' 
      ? inactiveClients 
      : activeClients

  const filteredClients = baseClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Filtros de estado */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('active')}
          className="gap-1"
        >
          <Users size={16} />
          Activos
          <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
            {activeClients.length}
          </Badge>
        </Button>
        <Button
          variant={statusFilter === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('inactive')}
          className="gap-1"
        >
          <UserMinus size={16} />
          Inactivos
          {inactiveClients.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600">
              {inactiveClients.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="gap-1"
        >
          <UsersThree size={16} />
          Todos
          <Badge variant="secondary" className="ml-1">
            {clientsList.length}
          </Badge>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowMap(!showMap)} variant="outline">
          <MapTrifold className="mr-2" />
          {showMap ? 'Ocultar' : 'Ver'} Mapa
        </Button>
        <Button onClick={() => {
          setEditingClient(undefined)
          setClientFormOpen(true)
        }}>
          <Plus className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {showMap && (
        <div ref={mapSectionRef}>
          <SimpleMap
            clients={filteredClients.filter(c => c.status !== 'Inactivo')}
            onClientClick={handleViewDetail}
            focusClient={focusClient}
          />
        </div>
      )}

      <ClientList
        clients={filteredClients}
        onClientClick={handleViewDetail}
        onDeleteClient={handleDeactivateClient}
        onCreateDosification={openDosificationForm}
        onLocateClient={(client) => {
          if (client.location) {
            setFocusClient(client)
            setShowMap(true)
            // Hacer scroll hacia el mapa para que el usuario vea el enfoque
            requestAnimationFrame(() => {
              mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            })
          }
        }}
        onReactivateClient={statusFilter !== 'active' ? handleReactivateClient : undefined}
        onPermanentDelete={statusFilter === 'inactive' ? handleRequestPermanentDelete : undefined}
      />

      <ClientForm
        open={clientFormOpen}
        onOpenChange={(open) => {
          setClientFormOpen(open)
          if (!open) setEditingClient(undefined)
        }}
        onSubmit={handleCreateClient}
        editClient={editingClient}
      />

      {dosificationClient && (
        <DosificationForm
          open={dosificationFormOpen}
          onOpenChange={(open) => {
            setDosificationFormOpen(open)
            if (!open) setDosificationClient(null)
          }}
          onSubmit={handleCreateDosification}
          client={dosificationClient}
          products={productsList}
        />
      )}

      {visitClient && (
        <VisitForm
          open={visitFormOpen}
          onOpenChange={(open) => {
            setVisitFormOpen(open)
            if (!open) setVisitClient(null)
          }}
          onSubmit={handleScheduleVisit}
          client={visitClient}
        />
      )}

      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          open={clientDetailOpen}
          onOpenChange={setClientDetailOpen}
          onEdit={handleEditClient}
          onUpdatePhotos={handleUpdatePhotos}
          dosifications={dosificationsList}
          visits={visitsList}
          onCreateDosification={openDosificationForm}
          onScheduleVisit={(client) => {
            setVisitClient(client)
            setVisitFormOpen(true)
          }}
        />
      )}

      {dosificationClient && (
        <DosificationForm
          open={dosificationFormOpen}
          onOpenChange={(open) => {
            setDosificationFormOpen(open)
            if (!open) setDosificationClient(null)
          }}
          onSubmit={handleCreateDosification}
          client={dosificationClient}
          products={productsList}
        />
      )}

      {/* Modal de confirmación para desactivar cliente */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <Warning size={24} weight="fill" />
              ¿Desactivar cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                Estás a punto de marcar como <strong>inactivo</strong> al cliente:
              </p>
              <p className="font-semibold text-foreground text-lg">
                {clientToDeactivate?.name}
              </p>
              <p className="text-sm">
                El cliente no será eliminado permanentemente. Podrás reactivarlo en cualquier momento 
                desde la sección de "Clientes Inactivos".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeactivateClient}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <UserMinus size={16} className="mr-2" />
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para eliminación definitiva (solo inactivos) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash size={24} weight="fill" />
              Eliminar cliente definitivamente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                Esta acción <strong>no se puede deshacer</strong> y eliminará al cliente de la base.
              </p>
              <p className="font-semibold text-foreground text-lg">
                {clientToDelete?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Considera exportar o respaldar los datos asociados antes de continuar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash size={16} className="mr-2" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
