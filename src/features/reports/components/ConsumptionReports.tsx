import { useState, useMemo } from 'react'
import { Client, Product, StockMovement } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  ChartBar, 
  ChartLine, 
  Download, 
  FunnelSimple,
  TrendUp,
  Package,
  Users,
  CalendarBlank,
  CaretDown,
  ChartPieSlice
} from '@phosphor-icons/react'
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, subMonths, isWithinInterval, parseISO, endOfDay, startOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ConsumptionReportsProps {
  clients: Client[]
  products: Product[]
  stockMovements: StockMovement[]
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all'

interface ConsumptionByClient {
  clientId: string
  clientName: string
  totalQuantity: number
  totalValue: number
  productCount: number
  products: {
    productId: string
    productName: string
    quantity: number
    value: number
  }[]
}

interface ConsumptionByProduct {
  productId: string
  productName: string
  category: string
  totalQuantity: number
  totalValue: number
  clientCount: number
  unit: string
}

export function ConsumptionReports({ clients, products, stockMovements }: ConsumptionReportsProps) {
  const [period, setPeriod] = useState<PeriodType>('month')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [includeInactive, setIncludeInactive] = useState(false)

  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'week':
        return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: now }
      case 'month':
        return { startDate: startOfMonth(now), endDate: now }
      case 'quarter':
        return { startDate: startOfQuarter(now), endDate: now }
      case 'year':
        return { startDate: startOfYear(now), endDate: now }
      case 'all':
        return { startDate: new Date(2020, 0, 1), endDate: now }
      case 'custom':
        return {
          startDate: customStartDate ? startOfDay(customStartDate) : startOfMonth(now),
          endDate: customEndDate ? endOfDay(customEndDate) : now
        }
      default:
        return { startDate: subMonths(now, 1), endDate: now }
    }
  }, [period, customStartDate, customEndDate])

  const filteredMovements = useMemo(() => {
    return stockMovements.filter(movement => {
      if (movement.type !== 'exit') return false
      
      const movementDate = parseISO(movement.createdAt)
      const inPeriod = period === 'all' || isWithinInterval(movementDate, { start: startDate, end: endDate })
      
      if (!inPeriod) return false

      if (movement.relatedTo?.type === 'dosification') {
        const clientName = movement.relatedTo.reference?.split(' - Cliente: ')[1]?.split(' - ')[0]
        if (selectedClient !== 'all' && clientName) {
          const client = clients.find(c => c.name === clientName)
          if (client?.id !== selectedClient) return false
        }

        // Si no incluimos inactivos, excluir movimientos de clientes inactivos
        if (!includeInactive && clientName) {
          const client = clients.find(c => c.name === clientName)
          if (client?.status === 'Inactivo') return false
        }
      }

      if (selectedCategory !== 'all') {
        const product = products.find(p => p.id === movement.productId)
        if (product?.category !== selectedCategory) return false
      }

      return true
    })
  }, [stockMovements, period, startDate, endDate, selectedClient, selectedCategory, clients, products, includeInactive])

  const consumptionByClient = useMemo((): ConsumptionByClient[] => {
    const clientMap = new Map<string, ConsumptionByClient>()

    filteredMovements.forEach(movement => {
      if (movement.relatedTo?.type !== 'dosification') return

      const clientName = movement.relatedTo.reference?.split(' - Cliente: ')[1]?.split(' - ')[0]
      if (!clientName) return

      const client = clients.find(c => c.name === clientName)
      if (!client) return

      // Excluir clientes inactivos del agregado si no se ha marcado incluir
      if (!includeInactive && client.status === 'Inactivo') return

      const product = products.find(p => p.id === movement.productId)
      const value = (product?.costPerUnit || 0) * movement.quantity

      if (!clientMap.has(client.id)) {
        clientMap.set(client.id, {
          clientId: client.id,
          clientName: client.name,
          totalQuantity: 0,
          totalValue: 0,
          productCount: 0,
          products: []
        })
      }

      const clientData = clientMap.get(client.id)!
      clientData.totalQuantity += movement.quantity
      clientData.totalValue += value

      const existingProduct = clientData.products.find(p => p.productId === movement.productId)
      if (existingProduct) {
        existingProduct.quantity += movement.quantity
        existingProduct.value += value
      } else {
        clientData.products.push({
          productId: movement.productId,
          productName: movement.productName,
          quantity: movement.quantity,
          value
        })
        clientData.productCount++
      }
    })

    return Array.from(clientMap.values()).sort((a, b) => b.totalValue - a.totalValue)
  }, [filteredMovements, clients, products, includeInactive])

  const consumptionByProduct = useMemo((): ConsumptionByProduct[] => {
    const productMap = new Map<string, ConsumptionByProduct>()

    filteredMovements.forEach(movement => {
      const product = products.find(p => p.id === movement.productId)
      if (!product) return

      const value = (product.costPerUnit || 0) * movement.quantity

      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          category: product.category,
          totalQuantity: 0,
          totalValue: 0,
          clientCount: 0,
          unit: product.unit
        })
      }

      const productData = productMap.get(product.id)!
      productData.totalQuantity += movement.quantity
      productData.totalValue += value
    })

    const productArray = Array.from(productMap.values())

    productArray.forEach(productData => {
      const uniqueClients = new Set<string>()
      filteredMovements.forEach(movement => {
        if (movement.productId === productData.productId && movement.relatedTo?.type === 'dosification') {
          const clientName = movement.relatedTo.reference?.split(' - Cliente: ')[1]?.split(' - ')[0]
          if (clientName) {
            const client = clients.find(c => c.name === clientName)
            if (client) uniqueClients.add(client.id)
          }
        }
      })
      productData.clientCount = uniqueClients.size
    })

    return productArray.sort((a, b) => b.totalQuantity - a.totalQuantity)
  }, [filteredMovements, products, clients])

  const totalConsumption = useMemo(() => {
    return {
      totalValue: filteredMovements.reduce((sum, m) => {
        const product = products.find(p => p.id === m.productId)
        return sum + ((product?.costPerUnit || 0) * m.quantity)
      }, 0),
      totalMovements: filteredMovements.length,
      activeClients: new Set(consumptionByClient.map(c => c.clientId)).size,
      productsUsed: new Set(filteredMovements.map(m => m.productId)).size
    }
  }, [filteredMovements, products, consumptionByClient])

  const maxClientValue = Math.max(...consumptionByClient.map(c => c.totalValue), 1)
  const maxProductQuantity = Math.max(...consumptionByProduct.map(p => p.totalQuantity), 1)

  const timeSeriesData = useMemo(() => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let intervals: Date[]
    let formatString: string
    
    if (daysDiff <= 31) {
      intervals = eachDayOfInterval({ start: startDate, end: endDate })
      formatString = 'dd MMM'
    } else if (daysDiff <= 90) {
      intervals = eachWeekOfInterval({ start: startDate, end: endDate })
      formatString = 'dd MMM'
    } else {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate })
      formatString = 'MMM yyyy'
    }

    return intervals.map(date => {
      const nextDate = new Date(date)
      if (daysDiff <= 31) {
        nextDate.setDate(nextDate.getDate() + 1)
      } else if (daysDiff <= 90) {
        nextDate.setDate(nextDate.getDate() + 7)
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }

      const movementsInPeriod = filteredMovements.filter(m => {
        const movementDate = parseISO(m.createdAt)
        return movementDate >= date && movementDate < nextDate
      })

      const value = movementsInPeriod.reduce((sum, m) => {
        const product = products.find(p => p.id === m.productId)
        return sum + ((product?.costPerUnit || 0) * m.quantity)
      }, 0)

      const quantity = movementsInPeriod.reduce((sum, m) => sum + m.quantity, 0)

      return {
        date: format(date, formatString, { locale: es }),
        fullDate: date,
        value: parseFloat(value.toFixed(2)),
        quantity: parseFloat(quantity.toFixed(2)),
        movements: movementsInPeriod.length
      }
    })
  }, [filteredMovements, startDate, endDate, products])

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { value: number; quantity: number }>()
    
    filteredMovements.forEach(movement => {
      const product = products.find(p => p.id === movement.productId)
      if (!product) return
      
      const value = (product.costPerUnit || 0) * movement.quantity
      const existing = categoryMap.get(product.category) || { value: 0, quantity: 0 }
      
      categoryMap.set(product.category, {
        value: existing.value + value,
        quantity: existing.quantity + movement.quantity
      })
    })

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: parseFloat(data.value.toFixed(2)),
      quantity: parseFloat(data.quantity.toFixed(2))
    })).sort((a, b) => b.value - a.value)
  }, [filteredMovements, products])

  const COLORS = [
    'oklch(0.55 0.15 145)',
    'oklch(0.65 0.18 50)',
    'oklch(0.45 0.08 60)',
    'oklch(0.50 0.12 240)',
    'oklch(0.60 0.10 180)',
    'oklch(0.70 0.20 30)'
  ]

  const handleExport = () => {
    const csvRows = [
      ['Reporte de Consumo de Productos'],
      ['Período', `${format(startDate, 'PP', { locale: es })} - ${format(endDate, 'PP', { locale: es })}`],
      [''],
      ['Consumo por Cliente'],
      ['Cliente', 'Total Productos', 'Cantidad Total', 'Valor Total ($)'],
      ...consumptionByClient.map(c => [
        c.clientName,
        c.productCount.toString(),
        c.totalQuantity.toFixed(2),
        c.totalValue.toFixed(2)
      ]),
      [''],
      ['Consumo por Producto'],
      ['Producto', 'Categoría', 'Cantidad', 'Unidad', 'Clientes', 'Valor Total ($)'],
      ...consumptionByProduct.map(p => [
        p.productName,
        p.category,
        p.totalQuantity.toFixed(2),
        p.unit,
        p.clientCount.toString(),
        p.totalValue.toFixed(2)
      ])
    ]

    const csv = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-consumo-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const periodLabels: Record<PeriodType, string> = {
    week: 'Última Semana',
    month: 'Último Mes',
    quarter: 'Último Trimestre',
    year: 'Último Año',
    custom: 'Personalizado',
    all: 'Todo el Tiempo'
  }

  const categories = Array.from(new Set(products.map(p => p.category)))
  const clientsForSelector = includeInactive ? clients : clients.filter(c => c.status !== 'Inactivo')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Reportes de Consumo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis detallado de consumo de productos por cliente y período
          </p>
        </div>
        
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download weight="bold" />
          Exportar CSV
        </Button>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <FunnelSimple size={24} weight="duotone" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Período</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(periodLabels) as PeriodType[]).map(p => (
                    <SelectItem key={p} value={p}>{periodLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Clientes</SelectItem>
                  {clientsForSelector.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Categoría</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="includeInactive"
              type="checkbox"
              className="accent-primary"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <label htmlFor="includeInactive" className="text-sm text-muted-foreground">
              Incluir clientes inactivos en filtros y cálculos
            </label>
          </div>

          {period === 'custom' && (
            <div className="border-t pt-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Rangos Rápidos</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCustomStartDate(subDays(now, 7))
                      setCustomEndDate(now)
                    }}
                  >
                    Últimos 7 días
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCustomStartDate(subDays(now, 15))
                      setCustomEndDate(now)
                    }}
                  >
                    Últimos 15 días
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCustomStartDate(subDays(now, 30))
                      setCustomEndDate(now)
                    }}
                  >
                    Últimos 30 días
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCustomStartDate(subDays(now, 60))
                      setCustomEndDate(now)
                    }}
                  >
                    Últimos 60 días
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCustomStartDate(subDays(now, 90))
                      setCustomEndDate(now)
                    }}
                  >
                    Últimos 90 días
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CalendarBlank size={16} />
                    Fecha de Inicio
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarBlank className="mr-2" size={16} />
                        {customStartDate ? format(customStartDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                        <CaretDown className="ml-auto" size={16} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        locale={es}
                        disabled={(date) => 
                          date > new Date() || !!(customEndDate && date > customEndDate)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CalendarBlank size={16} />
                    Fecha de Fin
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarBlank className="mr-2" size={16} />
                        {customEndDate ? format(customEndDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                        <CaretDown className="ml-auto" size={16} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        locale={es}
                        disabled={(date) => 
                          date > new Date() || !!(customStartDate && date < customStartDate)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {customStartDate && customEndDate && (
                <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <CalendarBlank size={16} weight="duotone" />
                    Rango seleccionado: {format(customStartDate, 'PP', { locale: es })} - {format(customEndDate, 'PP', { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24))} días de análisis
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarBlank size={20} />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodLabels[period]}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {period === 'custom' && customStartDate && customEndDate ? (
                `${format(customStartDate, 'PP', { locale: es })} - ${format(customEndDate, 'PP', { locale: es })}`
              ) : (
                `${format(startDate, 'PP', { locale: es })} - ${format(endDate, 'PP', { locale: es })}`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users size={20} />
              Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Con consumo registrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package size={20} />
              Productos Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.productsUsed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendUp size={20} />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">
              ${totalConsumption.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalConsumption.totalMovements} movimientos
            </p>
          </CardContent>
        </Card>
      </div>

      {filteredMovements.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ChartLine size={24} weight="duotone" className="text-primary" />
                  <div>
                    <CardTitle>Tendencia de Consumo en el Tiempo</CardTitle>
                    <CardDescription>Valor consumido por período</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 145)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.90 0.01 145)',
                        borderRadius: '0.5rem',
                        fontSize: '13px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="oklch(0.55 0.15 145)" 
                      strokeWidth={3}
                      fill="url(#colorValue)"
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ChartBar size={24} weight="duotone" className="text-accent" />
                  <div>
                    <CardTitle>Movimientos por Período</CardTitle>
                    <CardDescription>Cantidad total consumida</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 145)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.90 0.01 145)',
                        borderRadius: '0.5rem',
                        fontSize: '13px'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'quantity' ? value.toFixed(2) : value,
                        name === 'quantity' ? 'Cantidad' : 'Movimientos'
                      ]}
                    />
                    <Bar dataKey="quantity" fill="oklch(0.65 0.18 50)" radius={[8, 8, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ChartPieSlice size={24} weight="duotone" className="text-secondary" />
                  <div>
                    <CardTitle>Distribución por Categoría</CardTitle>
                    <CardDescription>Consumo por tipo de producto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={800}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'oklch(1 0 0)',
                          border: '1px solid oklch(0.90 0.01 145)',
                          borderRadius: '0.5rem',
                          fontSize: '13px'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat, index) => (
                      <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm font-mono font-bold">${cat.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendUp size={24} weight="duotone" className="text-primary" />
                  <div>
                    <CardTitle>Top 5 Productos</CardTitle>
                    <CardDescription>Productos más consumidos en valor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={consumptionByProduct.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 145)" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="productName" 
                      tick={{ fill: 'oklch(0.50 0.03 145)', fontSize: 12 }}
                      tickLine={{ stroke: 'oklch(0.90 0.01 145)' }}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.90 0.01 145)',
                        borderRadius: '0.5rem',
                        fontSize: '13px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor Total']}
                    />
                    <Bar dataKey="totalValue" fill="oklch(0.55 0.15 145)" radius={[0, 8, 8, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChartBar size={24} weight="duotone" className="text-primary" />
              <div>
                <CardTitle>Consumo por Cliente</CardTitle>
                <CardDescription>Top clientes por valor consumido</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {consumptionByClient.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No hay datos de consumo para el período seleccionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consumptionByClient.slice(0, 10).map((client) => (
                  <div key={client.clientId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{client.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.productCount} producto{client.productCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-primary">${client.totalValue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{client.totalQuantity.toFixed(1)} total</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${(client.totalValue / maxClientValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package size={24} weight="duotone" className="text-accent" />
              <div>
                <CardTitle>Productos Más Consumidos</CardTitle>
                <CardDescription>Top productos por cantidad</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {consumptionByProduct.length === 0 ? (
              <div className="py-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No hay datos de consumo para el período seleccionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consumptionByProduct.slice(0, 10).map((product) => (
                  <div key={product.productId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          <p className="text-xs text-muted-foreground">
                            {product.clientCount} cliente{product.clientCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-accent">{product.totalQuantity.toFixed(1)} {product.unit}</p>
                        <p className="text-xs text-muted-foreground">${product.totalValue.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all"
                        style={{ width: `${(product.totalQuantity / maxProductQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartLine size={24} weight="duotone" className="text-secondary" />
            <div>
              <CardTitle>Detalle de Consumo por Cliente</CardTitle>
              <CardDescription>Desglose completo de productos consumidos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {consumptionByClient.length === 0 ? (
            <div className="py-12 text-center">
              <ChartLine size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay datos para mostrar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {consumptionByClient.map((client) => (
                <div key={client.clientId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{client.clientName}</h4>
                    <Badge className="bg-primary text-primary-foreground">
                      Total: ${client.totalValue.toFixed(2)}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {client.products.map((product) => (
                      <div 
                        key={product.productId} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cantidad: <span className="font-mono font-semibold">{product.quantity.toFixed(2)}</span>
                          </p>
                        </div>
                        <p className="font-bold font-mono text-primary">${product.value.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
