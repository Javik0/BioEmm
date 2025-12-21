import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Client, Dosification } from '@/types'
import { ClientForm } from '@/components/ClientForm'
import { ClientList } from '@/components/ClientList'
import { DosificationForm } from '@/components/DosificationForm'
import { SimpleMap } from '@/components/SimpleMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Flask, MapTrifold, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

function App() {
  const [clients, setClients] = useKV<Client[]>('bioemm-clients', [])
  const [dosifications, setDosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [dosificationFormOpen, setDosificationFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('map')

  const clientsList = clients || []
  const dosificationsList = dosifications || []

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    setClients((current) => [...(current || []), newClient])
    setClientFormOpen(false)
    toast.success(`Cliente ${newClient.name} agregado correctamente`)
  }

  const handleDeleteClient = (clientId: string) => {
    const client = clientsList.find(c => c.id === clientId)
    if (!client) return

    if (confirm(`¿Eliminar cliente ${client.name}?`)) {
      setClients((current) => (current || []).filter(c => c.id !== clientId))
      toast.success('Cliente eliminado')
    }
  }

  const handleCreateDosification = (dosificationData: Omit<Dosification, 'id' | 'date'>) => {
    const newDosification: Dosification = {
      ...dosificationData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    }
    
    setDosifications((current) => [...(current || []), newDosification])
    setDosificationFormOpen(false)
    setSelectedClient(undefined)
    toast.success('Dosificación registrada correctamente')
  }

  const openDosificationForm = (client: Client) => {
    setSelectedClient(client)
    setDosificationFormOpen(true)
  }

  const filteredClients = clientsList.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cropType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalHectares = clientsList.reduce((sum, client) => sum + client.hectares, 0)
  const activeClients = clientsList.filter(c => c.status === 'Activo').length

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-primary">BioEmm</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gestión de Clientes Agrícolas</p>
            </div>
            <Button size="lg" onClick={() => setClientFormOpen(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2" weight="bold" />
              Nuevo Cliente
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users size={20} />
                Total Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientsList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeClients} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapTrifold size={20} />
                Hectáreas Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{totalHectares.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bajo gestión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flask size={20} />
                Dosificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dosificationsList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registradas
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapTrifold size={18} />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users size={18} />
                Lista
              </TabsTrigger>
              <TabsTrigger value="dosifications" className="flex items-center gap-2">
                <Flask size={18} />
                Dosificaciones
              </TabsTrigger>
            </TabsList>

            {(activeTab === 'list' || activeTab === 'dosifications') && (
              <div className="relative w-full sm:w-80">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          <TabsContent value="map" className="space-y-4">
            <SimpleMap
              clients={clientsList}
              onClientClick={(client) => {
                setSelectedClient(client)
                toast.info(`Cliente: ${client.name}`)
              }}
            />
            {clientsList.filter(c => !c.location).length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <p className="text-sm text-yellow-800">
                    <strong>{clientsList.filter(c => !c.location).length} clientes</strong> sin ubicación GPS.
                    Edítalos para agregarles coordenadas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <ClientList
              clients={filteredClients}
              onClientClick={(client) => setSelectedClient(client)}
              onDeleteClient={handleDeleteClient}
              onCreateDosification={openDosificationForm}
            />
          </TabsContent>

          <TabsContent value="dosifications" className="space-y-4">
            {dosificationsList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flask size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg text-muted-foreground mb-2">No hay dosificaciones registradas</p>
                  <p className="text-sm text-muted-foreground">
                    Crea una desde la ficha de un cliente
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {dosificationsList.map((dosification) => (
                  <Card key={dosification.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{dosification.clientName}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(dosification.date).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge variant={dosification.status === 'Completada' ? 'default' : 'secondary'}>
                          {dosification.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">Cultivo:</span>
                          <span className="font-medium">{dosification.cropType}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">Hectáreas:</span>
                          <span className="font-medium font-mono">{dosification.hectares} ha</span>
                        </div>
                        
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-semibold mb-2">Productos Aplicados:</p>
                          <div className="space-y-2">
                            {dosification.products.map((product, idx) => (
                              <div key={idx} className="flex justify-between text-sm bg-muted p-2 rounded">
                                <span>{product.productName}</span>
                                <span className="font-mono font-semibold">
                                  {product.quantity} {product.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {dosification.notes && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-sm text-muted-foreground">{dosification.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ClientForm
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleCreateClient}
      />

      <DosificationForm
        open={dosificationFormOpen}
        onOpenChange={setDosificationFormOpen}
        onSubmit={handleCreateDosification}
        client={selectedClient}
      />
    </div>
  )
}

export default App