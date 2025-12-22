import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Client, Dosification, Product, StockMovement } from '@/types'
import { ClientForm } from '@/components/ClientForm'
import { ClientList } from '@/components/ClientList'
import { ClientDetail } from '@/components/ClientDetail'
import { DosificationForm } from '@/components/DosificationForm'
import { SimpleMap } from '@/components/SimpleMap'
import { ProductForm } from '@/components/ProductForm'
import { ProductList } from '@/components/ProductList'
import { StockAdjustmentForm } from '@/components/StockAdjustmentForm'
import { StockHistory } from '@/components/StockHistory'
import { ConsumptionReports } from '@/components/ConsumptionReports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Flask, MapTrifold, MagnifyingGlass, Package, WarningCircle, ChartBar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

function App() {
  const [clients, setClients] = useKV<Client[]>('bioemm-clients', [])
  const [dosifications, setDosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  const [products, setProducts] = useKV<Product[]>('bioemm-products', [])
  const [stockMovements, setStockMovements] = useKV<StockMovement[]>('bioemm-stock-movements', [])
  
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [dosificationFormOpen, setDosificationFormOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false)
  const [clientDetailOpen, setClientDetailOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [adjustmentType, setAdjustmentType] = useState<'entry' | 'exit' | 'adjustment'>('entry')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('map')

  const clientsList = clients || []
  const dosificationsList = dosifications || []
  const productsList = products || []
  const stockMovementsList = stockMovements || []

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      setClients((current) =>
        (current || []).map((c) =>
          c.id === editingClient.id
            ? { ...clientData, id: editingClient.id, createdAt: editingClient.createdAt }
            : c
        )
      )
      toast.success(`Cliente ${clientData.name} actualizado correctamente`)
      setEditingClient(undefined)
    } else {
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      setClients((current) => [...(current || []), newClient])
      toast.success(`Cliente ${newClient.name} agregado correctamente`)
    }
    setClientFormOpen(false)
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

  const handleApplyDosification = (dosification: Dosification) => {
    if (dosification.status === 'Aplicada' || dosification.status === 'Completada') {
      toast.error('Esta dosificación ya fue aplicada')
      return
    }

    const stockIssues: string[] = []
    
    dosification.products.forEach(dosProduct => {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) {
        stockIssues.push(`${dosProduct.productName}: Producto no encontrado en inventario`)
      } else if (product.currentStock < dosProduct.quantity) {
        stockIssues.push(
          `${dosProduct.productName}: Stock insuficiente (Disponible: ${product.currentStock} ${product.unit}, Requerido: ${dosProduct.quantity} ${dosProduct.unit})`
        )
      }
    })

    if (stockIssues.length > 0) {
      toast.error(
        <div>
          <p className="font-semibold">No se puede aplicar la dosificación:</p>
          <ul className="mt-2 text-xs space-y-1">
            {stockIssues.map((issue, idx) => (
              <li key={idx}>• {issue}</li>
            ))}
          </ul>
        </div>
      )
      return
    }

    if (!confirm(`¿Aplicar dosificación para ${dosification.clientName}? Se descontará el stock automáticamente.`)) {
      return
    }

    dosification.products.forEach(dosProduct => {
      const product = productsList.find(p => p.id === dosProduct.productId)
      if (!product) return

      const newStock = product.currentStock - dosProduct.quantity

      const movement: StockMovement = {
        id: Date.now().toString() + Math.random(),
        productId: product.id,
        productName: product.name,
        type: 'exit',
        quantity: dosProduct.quantity,
        previousStock: product.currentStock,
        newStock: newStock,
        reason: `Dosificación aplicada - Cliente: ${dosification.clientName}`,
        relatedTo: {
          type: 'dosification',
          id: dosification.id,
          reference: `Dosificación ${dosification.clientName} - ${dosProduct.quantity} ${dosProduct.unit}`
        },
        createdAt: new Date().toISOString()
      }

      setStockMovements((current) => [...(current || []), movement])
    })

    setProducts((current) =>
      (current || []).map((p) => {
        const dosProduct = dosification.products.find(dp => dp.productId === p.id)
        if (dosProduct) {
          return {
            ...p,
            currentStock: p.currentStock - dosProduct.quantity
          }
        }
        return p
      })
    )

    setDosifications((current) =>
      (current || []).map((d) =>
        d.id === dosification.id ? { ...d, status: 'Aplicada' as const } : d
      )
    )

    toast.success(
      <div>
        <p className="font-semibold">Dosificación aplicada correctamente</p>
        <p className="text-xs mt-1">Stock descontado del inventario</p>
      </div>
    )
  }

  const openDosificationForm = (client: Client) => {
    setSelectedClient(client)
    setDosificationFormOpen(true)
  }

  const openClientDetail = (client: Client) => {
    setSelectedClient(client)
    setClientDetailOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientFormOpen(true)
  }

  const handleCreateProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      setProducts((current) =>
        (current || []).map((p) =>
          p.id === editingProduct.id
            ? { ...productData, id: editingProduct.id, createdAt: editingProduct.createdAt }
            : p
        )
      )
      toast.success(`Producto ${productData.name} actualizado`)
      setEditingProduct(undefined)
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      setProducts((current) => [...(current || []), newProduct])
      toast.success(`Producto ${newProduct.name} agregado al inventario`)
    }
    
    setProductFormOpen(false)
  }

  const handleDeleteProduct = (productId: string) => {
    const product = productsList.find(p => p.id === productId)
    if (!product) return

    if (confirm(`¿Eliminar producto ${product.name} del inventario?`)) {
      setProducts((current) => (current || []).filter(p => p.id !== productId))
      toast.success('Producto eliminado')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormOpen(true)
  }

  const handleAdjustStock = (product: Product, type: 'entry' | 'exit') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setStockAdjustmentOpen(true)
  }

  const handleStockMovement = (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    setStockMovements((current) => [...(current || []), newMovement])
    
    setProducts((current) =>
      (current || []).map((p) =>
        p.id === movementData.productId
          ? { 
              ...p, 
              currentStock: movementData.newStock,
              lastRestockDate: movementData.type === 'entry' ? new Date().toISOString() : p.lastRestockDate
            }
          : p
      )
    )
    
    const actionText = movementData.type === 'entry' ? 'Entrada' : movementData.type === 'exit' ? 'Salida' : 'Ajuste'
    toast.success(`${actionText} de stock registrada`)
  }

  const filteredClients = clientsList.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cropType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = productsList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalHectares = clientsList.reduce((sum, client) => sum + client.hectares, 0)
  const activeClients = clientsList.filter(c => c.status === 'Activo').length
  const lowStockProducts = productsList.filter(p => p.currentStock <= p.minStock).length
  const criticalStockProducts = productsList.filter(p => p.currentStock <= p.minStock * 0.5).length
  const totalInventoryValue = productsList.reduce((sum, p) => sum + (p.currentStock * (p.costPerUnit || 0)), 0)

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
            <Button size="lg" onClick={() => {
              setEditingClient(undefined)
              setClientFormOpen(true)
            }} className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2" weight="bold" />
              Nuevo Cliente
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <Card className={criticalStockProducts > 0 ? 'border-red-300 bg-red-50' : lowStockProducts > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package size={20} />
                Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{productsList.length}</div>
              <div className="flex items-center gap-2 mt-1">
                {criticalStockProducts > 0 ? (
                  <Badge className="bg-red-600 text-white flex items-center gap-1">
                    <WarningCircle weight="fill" size={14} />
                    {criticalStockProducts} crítico{criticalStockProducts > 1 ? 's' : ''}
                  </Badge>
                ) : lowStockProducts > 0 ? (
                  <Badge className="bg-yellow-600 text-white flex items-center gap-1">
                    <WarningCircle weight="fill" size={14} />
                    {lowStockProducts} bajo{lowStockProducts > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <p className="text-xs text-muted-foreground">Stock normal</p>
                )}
              </div>
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
                Clientes
              </TabsTrigger>
              <TabsTrigger value="dosifications" className="flex items-center gap-2">
                <Flask size={18} />
                Dosificaciones
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package size={18} />
                Inventario
                {lowStockProducts > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600">
                    {lowStockProducts}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <ChartBar size={18} />
                Reportes
              </TabsTrigger>
            </TabsList>

            {(activeTab === 'list' || activeTab === 'dosifications' || activeTab === 'inventory') && (
              <div className="relative w-full sm:w-80">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder={
                    activeTab === 'inventory' ? 'Buscar productos...' : 'Buscar clientes...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {activeTab === 'inventory' && (
              <Button onClick={() => {
                setEditingProduct(undefined)
                setProductFormOpen(true)
              }} className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2" weight="bold" />
                Nuevo Producto
              </Button>
            )}
          </div>

          <TabsContent value="map" className="space-y-4">
            <SimpleMap
              clients={clientsList}
              dosifications={dosificationsList}
              onClientClick={(client) => {
                openClientDetail(client)
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
              onClientClick={openClientDetail}
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
                {dosificationsList
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((dosification) => (
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
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            dosification.status === 'Aplicada' ? 'default' : 
                            dosification.status === 'Completada' ? 'default' : 
                            'secondary'
                          }
                          className={
                            dosification.status === 'Aplicada' ? 'bg-green-600' :
                            dosification.status === 'Completada' ? 'bg-blue-600' :
                            ''
                          }>
                            {dosification.status}
                          </Badge>
                          {dosification.status === 'Pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyDosification(dosification)}
                              className="bg-accent hover:bg-accent/90"
                            >
                              <Flask className="mr-1" size={16} weight="bold" />
                              Aplicar
                            </Button>
                          )}
                        </div>
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
                            {dosification.products.map((product, idx) => {
                              const inventoryProduct = productsList.find(p => p.id === product.productId)
                              const hasStock = inventoryProduct && inventoryProduct.currentStock >= product.quantity
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`flex justify-between items-center text-sm p-2 rounded ${
                                    dosification.status === 'Pendiente' && !hasStock 
                                      ? 'bg-red-100 border border-red-300' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    {product.productName}
                                    {dosification.status === 'Pendiente' && !hasStock && (
                                      <Badge variant="destructive" className="text-xs">
                                        Sin stock
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="font-mono font-semibold">
                                    {product.quantity} {product.unit}
                                  </span>
                                </div>
                              )
                            })}
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

          <TabsContent value="inventory" className="space-y-6">
            {lowStockProducts > 0 && (
              <Card className={criticalStockProducts > 0 ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <WarningCircle 
                      size={32} 
                      weight="fill" 
                      className={criticalStockProducts > 0 ? 'text-red-600' : 'text-yellow-600'}
                    />
                    <div>
                      <p className={`font-semibold ${criticalStockProducts > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                        {criticalStockProducts > 0 ? '¡Alerta de Stock Crítico!' : 'Alerta de Stock Bajo'}
                      </p>
                      <p className={`text-sm ${criticalStockProducts > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                        {criticalStockProducts > 0 
                          ? `${criticalStockProducts} producto${criticalStockProducts > 1 ? 's' : ''} en nivel crítico. `
                          : `${lowStockProducts} producto${lowStockProducts > 1 ? 's' : ''} por debajo del stock mínimo. `}
                        Considera realizar un reabastecimiento.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {totalInventoryValue > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Valor Total del Inventario</p>
                      <p className="text-3xl font-bold font-mono text-primary">
                        ${totalInventoryValue.toFixed(2)}
                      </p>
                    </div>
                    <Package size={48} className="text-primary opacity-20" weight="duotone" />
                  </div>
                </CardContent>
              </Card>
            )}

            <ProductList
              products={filteredProducts}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
            />

            {productsList.length > 0 && (
              <StockHistory movements={stockMovementsList} />
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ConsumptionReports
              clients={clientsList}
              products={productsList}
              stockMovements={stockMovementsList}
            />
          </TabsContent>
        </Tabs>
      </main>

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
        client={selectedClient || null}
        open={clientDetailOpen}
        onOpenChange={setClientDetailOpen}
        onEdit={handleEditClient}
      />

      <DosificationForm
        open={dosificationFormOpen}
        onOpenChange={setDosificationFormOpen}
        onSubmit={handleCreateDosification}
        client={selectedClient}
        products={productsList}
      />

      <ProductForm
        open={productFormOpen}
        onOpenChange={(open) => {
          setProductFormOpen(open)
          if (!open) setEditingProduct(undefined)
        }}
        onSubmit={handleCreateProduct}
        editProduct={editingProduct}
      />

      <StockAdjustmentForm
        open={stockAdjustmentOpen}
        onOpenChange={setStockAdjustmentOpen}
        product={selectedProduct}
        type={adjustmentType}
        onSubmit={handleStockMovement}
      />
    </div>
  )
}

export default App