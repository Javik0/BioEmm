import { useEffect, useState } from 'react'
import { Dosification } from '@/types'
import { AuthGate } from '@/components/AuthGate'
import { useClients } from '@/features/clients'
import { useProducts } from '@/features/products'
import { useDosifications } from '@/features/dosifications'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Flask, MapTrifold, Package, WarningCircle, ChartBar, Calculator, ShieldCheck, UsersThree, CalendarDots, ClipboardText, BellSimple } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserProfile } from '@/components/UserProfile'
import ClientsPage from '@/pages/ClientsPage'
import ProductsPage from '@/pages/ProductsPage'
import DosificationsPage from '@/pages/DosificationsPage'
import InventoryPage from '@/pages/InventoryPage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'
import RolesPage from '@/pages/RolesPage'
import AgendaPage from '@/pages/AgendaPage'
import OrdersPage from '@/pages/OrdersPage'
import AlertsPage from '@/pages/AlertsPage'
import logoImage from '@/assets/branding/BioEmm.jpg'

function App() {
  const { clients: clientsList } = useClients()
  const { products: productsList } = useProducts()
  const { dosifications } = useDosifications()
  const [activeTab, setActiveTab] = useState('clients')

  const dosificationsList = dosifications || []

  // Estadísticas
  const totalHectares = clientsList.reduce((sum, client) => sum + client.hectares, 0)
  const activeClients = clientsList.filter(c => c.status === 'Activo').length
  const lowStockProducts = productsList.filter(p => p.currentStock <= p.minStock).length
  const criticalStockProducts = productsList.filter(p => p.currentStock <= p.minStock * 0.5).length

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return
      if (hash.startsWith('orders')) {
        setActiveTab('orders')
        const parts = hash.split(':')
        if (parts[1]) {
          sessionStorage.setItem('ordersPreferredClientId', parts[1])
        }
      }
      if (hash === 'alerts') setActiveTab('alerts')
      if (hash === 'inventory') setActiveTab('inventory')
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Toaster />
      
        <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo con estilo profesional */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
                    <img 
                      src={logoImage} 
                      alt="BioEMS Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary tracking-tight">BioEMS</h1>
                  <p className="text-xs text-muted-foreground">Sistema de Gestión Agrícola</p>
                </div>
              </div>
              
              {/* Theme Toggle y User Profile */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <UserProfile />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-4">
          {/* Dashboard Cards - Compactas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="py-2">
              <CardContent className="p-3 flex items-center gap-3">
                <Users size={18} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Total Clientes</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{clientsList.length}</span>
                    <span className="text-xs text-muted-foreground">{activeClients} activos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="p-3 flex items-center gap-3">
                <MapTrifold size={18} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Hectáreas Totales</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono">{totalHectares.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">Bajo gestión</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-2">
              <CardContent className="p-3 flex items-center gap-3">
                <Flask size={18} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Dosificaciones</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{dosificationsList.length}</span>
                    <span className="text-xs text-muted-foreground">Registradas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`py-2 ${criticalStockProducts > 0 ? 'border-red-300 bg-red-50' : lowStockProducts > 0 ? 'border-yellow-300 bg-yellow-50' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Package size={18} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Inventario</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{productsList.length}</span>
                    {criticalStockProducts > 0 ? (
                      <Badge className="bg-red-600 text-white text-xs px-1 py-0">
                        {criticalStockProducts} crítico
                      </Badge>
                    ) : lowStockProducts > 0 ? (
                      <Badge className="bg-yellow-600 text-white text-xs px-1 py-0">
                        {lowStockProducts} bajo
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Stock normal</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users size={18} />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <CalendarDots size={18} />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package size={18} />
                Productos
              </TabsTrigger>
              <TabsTrigger value="dosifications" className="flex items-center gap-2">
                <Calculator size={18} />
                Dosificación
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
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardText size={18} />
                Órdenes
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <BellSimple size={18} />
                Alertas
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <ChartBar size={18} />
                Reportes
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersThree size={18} />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <ShieldCheck size={18} />
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <ClientsPage />
            </TabsContent>

            <TabsContent value="agenda">
              <AgendaPage />
            </TabsContent>

            <TabsContent value="products">
              <ProductsPage />
            </TabsContent>

            <TabsContent value="dosifications">
              <DosificationsPage />
            </TabsContent>

            <TabsContent value="inventory">
              <InventoryPage />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersPage />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsPage />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsPage />
            </TabsContent>

            <TabsContent value="users">
              <UsersPage />
            </TabsContent>

            <TabsContent value="roles">
              <RolesPage />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGate>
  )
}

export default App
