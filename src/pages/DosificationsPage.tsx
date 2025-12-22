import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Client, Dosification, Product, StockMovement } from '@/types'
import { useClients } from '@/features/clients'
import { DosificationForm, CropCalculator } from '@/features/dosifications'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function DosificationsPage() {
  const { clients: clientsList } = useClients()
  const [dosifications, setDosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  const [products, setProducts] = useKV<Product[]>('bioemm-products', [])
  const [stockMovements, setStockMovements] = useKV<StockMovement[]>('bioemm-stock-movements', [])
  const [dosificationFormOpen, setDosificationFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [activeTab, setActiveTab] = useState('calculator')

  const dosificationsList = dosifications || []
  const productsList = products || []

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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">
            <Calculator className="mr-2" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <CropCalculator
            clients={clientsList}
            products={productsList}
            onCreateDosification={openDosificationForm}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Aquí podrías agregar un componente para mostrar el historial de dosificaciones */}
          <p>Historial de dosificaciones (por implementar)</p>
        </TabsContent>
      </Tabs>

      {selectedClient && (
        <DosificationForm
          open={dosificationFormOpen}
          onOpenChange={setDosificationFormOpen}
          onSubmit={handleCreateDosification}
          client={selectedClient}
          products={productsList}
        />
      )}
    </div>
  )
}
