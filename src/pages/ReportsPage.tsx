import { StockMovement } from '@/types'
import { useClients } from '@/features/clients'
import { useProducts } from '@/features/products'
import { useStockMovements } from '@/features/inventory'
import { useDosifications } from '@/features/dosifications'
import { ConsumptionReports } from '@/features/reports'

export default function ReportsPage() {
  const { clients } = useClients()
  const { products } = useProducts()
  const { stockMovements } = useStockMovements()
  const { dosifications } = useDosifications()

  const stockMovementsList = stockMovements || []
  const productsList = products || []
  const clientsList = clients || []

  return (
    <div className="space-y-4">
      <ConsumptionReports
        stockMovements={stockMovementsList}
        products={productsList}
        clients={clientsList}
        dosifications={dosifications || []}
      />
    </div>
  )
}
