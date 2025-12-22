import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Client, ClientPhoto, Dosification, Product, Visit } from '@/types'
import { useClients, ClientForm, ClientList, ClientDetail } from '@/features/clients'
import { uploadClientPhoto, isBase64Url } from '@/features/clients/services/storageService'
import { DosificationForm } from '@/features/dosifications'
import { SimpleMap } from '@/components/SimpleMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, MapTrifold, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function ClientsPage() {
  const { clients: clientsList, upsertClient, deleteClient } = useClients()
  const [dosifications, setDosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  const [products] = useKV<Product[]>('bioemm-products', [])
  const [visits] = useKV<Visit[]>('bioemm-visits', [])

  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [clientDetailOpen, setClientDetailOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [dosificationFormOpen, setDosificationFormOpen] = useState(false)
  const [dosificationClient, setDosificationClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [focusClient, setFocusClient] = useState<Client | undefined>()

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

  const handleDeleteClient = (clientId: string) => {
    const client = clientsList.find(c => c.id === clientId)
    if (!client) return

    if (confirm(`¿Eliminar cliente ${client.name}?`)) {
      void (async () => {
        try {
          await deleteClient(clientId)
          toast.success('Cliente eliminado')
        } catch (err: any) {
          toast.error(err?.message || 'No se pudo eliminar el cliente (Firestore)')
        }
      })()
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

  const handleCreateDosification = (dosificationData: Omit<Dosification, 'id' | 'date'>) => {
    const newDosification: Dosification = {
      ...dosificationData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }

    setDosifications((current) => [...(current || []), newDosification])
    setDosificationFormOpen(false)
    setDosificationClient(null)
    toast.success('Dosificación registrada correctamente')
  }

  const filteredClients = clientsList.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
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
        <SimpleMap
          clients={filteredClients}
          onClientClick={handleViewDetail}
          focusClient={focusClient}
        />
      )}

      <ClientList
        clients={filteredClients}
        onClientClick={handleViewDetail}
        onDeleteClient={handleDeleteClient}
        onCreateDosification={openDosificationForm}
        onLocateClient={(client) => {
          if (client.location) {
            setFocusClient(client)
            setShowMap(true)
          }
        }}
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

      <ClientDetail
        client={selectedClient ?? null}
        open={clientDetailOpen}
        onOpenChange={setClientDetailOpen}
        onEdit={handleEditClient}
        onUpdatePhotos={handleUpdatePhotos}
        dosifications={dosificationsList}
        visits={visitsList}
        onCreateDosification={openDosificationForm}
        onScheduleVisit={(client) => {
          toast.info(`Función de programar visita para ${client.name} - Próximamente`)
          // TODO: Implementar formulario de visitas
        }}
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
    </div>
  )
}
