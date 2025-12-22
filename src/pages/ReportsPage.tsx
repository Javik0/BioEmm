import { useKV } from '@github/spark/hooks'
import { Product, StockMovement } from '@/types'
import { useClients } from '@/features/clients'
import { ConsumptionReports } from '@/features/reports'

export default function ReportsPage() {
  const { clients } = useClients()
  const [stockMovements] = useKV<StockMovement[]>('bioemm-stock-movements', [])
  const [products] = useKV<Product[]>('bioemm-products', [])

  const stockMovementsList = stockMovements || []
  const productsList = products || []
  const clientsList = clients || []

  return (
    <div className="space-y-4">
      <ConsumptionReports
        stockMovements={stockMovementsList}
        products={productsList}
        clients={clientsList}
      />
    </div>
  )
}
