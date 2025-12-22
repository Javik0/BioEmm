import { useState } from 'react'
import { Client } from '@/types'
import { useClients, ClientForm, ClientList, ClientDetail } from '@/features/clients'
import { SimpleMap } from '@/components/SimpleMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, MapTrifold, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function ClientsPage() {
  const { clients: clientsList, upsertClient, deleteClient } = useClients()
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [clientDetailOpen, setClientDetailOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [showMap, setShowMap] = useState(false)

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
        />
      )}

      <ClientList
        clients={filteredClients}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        onViewDetail={handleViewDetail}
      />

      <ClientForm
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleCreateClient}
        initialData={editingClient}
      />

      <ClientDetail
        client={selectedClient}
        open={clientDetailOpen}
        onOpenChange={setClientDetailOpen}
      />
    </div>
  )
}
