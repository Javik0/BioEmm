import { MapPin } from '@phosphor-icons/react'
import { Client } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SimpleMapProps {
  clients: Client[]
  onClientClick?: (client: Client) => void
  onMapClick?: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
}

export function SimpleMap({ clients, onClientClick, onMapClick, selectedLocation }: SimpleMapProps) {
  const bounds = {
    minLat: -5,
    maxLat: 2,
    minLng: -82,
    maxLng: -75
  }

  const normalizeX = (lng: number) => {
    return ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
  }

  const normalizeY = (lat: number) => {
    return ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const lng = bounds.minLng + (x / 100) * (bounds.maxLng - bounds.minLng)
    const lat = bounds.maxLat - (y / 100) * (bounds.maxLat - bounds.minLat)
    
    onMapClick(lat, lng)
  }

  const getCropColor = (cropType: string) => {
    const colors: Record<string, string> = {
      'Flores': 'bg-pink-500',
      'Hortalizas': 'bg-green-600',
      'Frutas': 'bg-orange-500',
      'Granos': 'bg-yellow-600',
      'Tubérculos': 'bg-amber-700',
      'Otro': 'bg-gray-500'
    }
    return colors[cropType] || 'bg-gray-500'
  }

  return (
    <Card className="relative w-full h-[500px] overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 cursor-crosshair">
      <div 
        className="absolute inset-0" 
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-md text-sm font-medium shadow-sm">
          Ecuador - Zona de Clientes
        </div>

        {clients.map((client) => {
          if (!client.location) return null
          
          const x = normalizeX(client.location.lng)
          const y = normalizeY(client.location.lat)
          
          return (
            <div
              key={client.id}
              className="absolute group cursor-pointer"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClientClick?.(client)
              }}
            >
              <div className={`${getCropColor(client.cropType)} rounded-full p-2 shadow-lg hover:scale-110 transition-transform`}>
                <MapPin size={20} weight="fill" className="text-white" />
              </div>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-white rounded-lg shadow-xl p-3 min-w-[200px]">
                  <div className="font-semibold text-sm mb-1">{client.name}</div>
                  <Badge variant="secondary" className="text-xs mb-1">
                    {client.cropType}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {client.hectares} ha
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {selectedLocation && (
          <div
            className="absolute"
            style={{
              left: `${normalizeX(selectedLocation.lng)}%`,
              top: `${normalizeY(selectedLocation.lat)}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-accent rounded-full p-3 shadow-lg animate-pulse">
              <MapPin size={24} weight="fill" className="text-accent-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm text-xs space-y-1">
        <div className="font-semibold mb-2">Leyenda</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span>Flores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span>Hortalizas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Frutas</span>
        </div>
      </div>
    </Card>
  )
}
