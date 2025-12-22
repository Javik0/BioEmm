import { useKV } from '@github/spark/hooks'
import { Dosification, Product, Client } from '@/types'
import { useClients } from '@/features/clients'
import { ConsumptionReports } from '@/features/reports'

export default function ReportsPage() {
  const { clients } = useClients()
  const [dosifications] = useKV<Dosification[]>('bioemm-dosifications', [])
  const [products] = useKV<Product[]>('bioemm-products', [])

  const dosificationsList = dosifications || []
  const productsList = products || []
  const clientsList = clients || []

  return (
    <div className="space-y-4">
      <ConsumptionReports
        dosifications={dosificationsList}
        products={productsList}
        clients={clientsList}
      />
    </div>
  )
}
