import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Client, Dosification, CropType, ClientStatus, CROP_TYPES } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, MapTrifold, Stack, CaretDown, Funnel, X } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

interface SimpleMapProps {
  clients: Client[]
  dosifications?: Dosification[]
  onClientClick?: (client: Client) => void
  onMapClick?: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
  focusClient?: Client
}

const getCropColor = (cropType: string) => {
  const colorPalette = [
    '#ec4899', '#16a34a', '#f97316', '#ca8a04', '#b45309', '#6366f1',
    '#8b5cf6', '#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#f59e0b',
    '#ef4444', '#f43f5e', '#d946ef', '#a855f7', '#6366f1', '#3b82f6',
    '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16',
    '#a3e635', '#eab308', '#facc15', '#fbbf24', '#fb923c', '#f97316',
    '#ea580c', '#dc2626', '#e11d48', '#be123c', '#9f1239', '#881337',
    '#7c2d12', '#78350f', '#713f12', '#854d0e', '#a16207', '#4d7c0f',
    '#365314', '#14532d', '#052e16', '#064e3b', '#134e4a', '#1e293b',
    '#0f172a', '#1e1b4b', '#312e81', '#3730a3', '#4c1d95', '#581c87',
    '#5b21b6', '#6b21a8', '#7e22ce', '#86198f', '#a21caf', '#be185d',
    '#9f1239', '#881337', '#7f1d1d', '#7c2d12', '#78350f', '#713f12',
    '#365314', '#14532d', '#134e4a', '#164e63', '#1e3a8a', '#1e40af',
    '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe',
  ]
  
  const hash = cropType.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  const index = Math.abs(hash) % colorPalette.length
  return colorPalette[index]
}

const createCustomIcon = (color: string) => {
  const svgIcon = `
    <svg width="40" height="56" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#markerShadow)">
        <path d="M20 0C10.059 0 2 8.059 2 18c0 14 18 38 18 38s18-24 18-38c0-9.941-8.059-18-18-18z" 
              fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="20" cy="18" r="7.5" fill="white"/>
        <circle cx="20" cy="18" r="4" fill="${color}"/>
      </g>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker',
    iconSize: [40, 56],
    iconAnchor: [20, 56],
    popupAnchor: [0, -56]
  })
}

const createSelectedIcon = () => {
  const svgIcon = `
    <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E87D3E;stop-opacity:1" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow)">
        <path d="M24 2C14.059 2 6 10.059 6 20c0 14 18 42 18 42s18-28 18-42c0-9.941-8.059-18-18-18z" 
              fill="url(#pinGradient)" stroke="white" stroke-width="4"/>
        <circle cx="24" cy="20" r="10" fill="white"/>
        <circle cx="24" cy="20" r="6" fill="#FF6B35">
          <animate attributeName="r" values="6;7;6" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker selected-marker',
    iconSize: [48, 64],
    iconAnchor: [24, 64],
    popupAnchor: [0, -64]
  })
}

export function SimpleMap({ clients, dosifications = [], onClientClick, onMapClick, selectedLocation, focusClient }: SimpleMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const selectedMarkerRef = useRef<L.Marker | null>(null)
  const baseLayersRef = useRef<{ osm: L.TileLayer; satellite: L.TileLayer; hybrid: L.TileLayer } | null>(null)
  
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'hybrid'>('osm')
  const [selectedCropTypes, setSelectedCropTypes] = useState<Set<CropType>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ClientStatus>>(new Set())

  const statuses: ClientStatus[] = ['Activo', 'Inactivo', 'Prospecto']

  const toggleCropType = (cropType: CropType) => {
    setSelectedCropTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cropType)) {
        newSet.delete(cropType)
      } else {
        newSet.add(cropType)
      }
      return newSet
    })
  }

  const toggleStatus = (status: ClientStatus) => {
    setSelectedStatuses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

  const clearAllFilters = () => {
    setSelectedCropTypes(new Set())
    setSelectedStatuses(new Set())
  }

  const filteredClients = clients.filter((client) => {
    const cropTypeMatch = selectedCropTypes.size === 0 || selectedCropTypes.has(client.cropType)
    const statusMatch = selectedStatuses.size === 0 || selectedStatuses.has(client.status)
    return cropTypeMatch && statusMatch
  })

  const hasActiveFilters = selectedCropTypes.size > 0 || selectedStatuses.size > 0

  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [-1.5, -78.5],
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    })

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 5
    })

    const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google',
      maxZoom: 20,
      minZoom: 5
    })

    const hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google',
      maxZoom: 20,
      minZoom: 5
    })

    osmLayer.addTo(map)

    baseLayersRef.current = {
      osm: osmLayer,
      satellite: satelliteLayer,
      hybrid: hybridLayer
    }

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onMapClick])

  useEffect(() => {
    if (!mapRef.current || !baseLayersRef.current) return

    mapRef.current.removeLayer(baseLayersRef.current.osm)
    mapRef.current.removeLayer(baseLayersRef.current.satellite)
    mapRef.current.removeLayer(baseLayersRef.current.hybrid)

    if (mapType === 'osm') {
      mapRef.current.addLayer(baseLayersRef.current.osm)
    } else if (mapType === 'satellite') {
      mapRef.current.addLayer(baseLayersRef.current.satellite)
    } else {
      mapRef.current.addLayer(baseLayersRef.current.hybrid)
    }
  }, [mapType])

  // Focus on specific client (zoom + open popup)
  useEffect(() => {
    if (!mapRef.current || !focusClient?.location) return

    mapRef.current.setView(
      [focusClient.location.lat, focusClient.location.lng],
      14,
      { animate: true, duration: 0.8 }
    )

    // open popup if marker exists
    const marker = markersRef.current.get(focusClient.id)
    if (marker) {
      marker.openPopup()
    }
  }, [focusClient])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    filteredClients.forEach(client => {
      if (!client.location) return

      const clientDosifications = dosifications.filter(d => d.clientId === client.id)
      const pendingDosifications = clientDosifications.filter(d => d.status === 'Pendiente').length
      const appliedDosifications = clientDosifications.filter(d => d.status === 'Aplicada' || d.status === 'Completada').length
      const lastDosification = clientDosifications.length > 0 
        ? new Date(Math.max(...clientDosifications.map(d => new Date(d.date).getTime())))
        : null

      const marker = L.marker(
        [client.location.lat, client.location.lng],
        { icon: createCustomIcon(getCropColor(client.cropType)) }
      )

      const statusBadge = client.status === 'Activo' 
        ? '<span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">ACTIVO</span>'
        : client.status === 'Inactivo'
        ? '<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">INACTIVO</span>'
        : '<span style="background: #f97316; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">PROSPECTO</span>'

      const dosificationInfo = clientDosifications.length > 0 
        ? `
          <div style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px;">
            <div style="font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">📋 Dosificaciones:</div>
            <div style="display: flex; gap: 8px; font-size: 11px;">
              ${appliedDosifications > 0 ? `<span style="color: #16a34a;">✓ ${appliedDosifications} aplicadas</span>` : ''}
              ${pendingDosifications > 0 ? `<span style="color: #f97316; font-weight: 600;">⏳ ${pendingDosifications} pendientes</span>` : ''}
            </div>
            ${lastDosification ? `<div style="font-size: 10px; color: #64748b; margin-top: 4px;">Última: ${lastDosification.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}</div>` : ''}
          </div>
        `
        : '<div style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px; font-size: 11px; color: #94a3b8;">Sin dosificaciones registradas</div>'

      const popupContent = `
        <div style="font-family: 'IBM Plex Sans', sans-serif; min-width: 240px; max-width: 320px;">
          <div style="margin-bottom: 10px;">
            <div style="font-weight: 700; font-size: 16px; color: #1a1a1a; line-height: 1.3; margin-bottom: 4px;">
              ${client.name}
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${statusBadge}
              ${client.photos && client.photos.length > 0 ? `
                <span style="display: inline-flex; align-items: center; gap: 3px; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                  📷 ${client.photos.length}
                </span>
              ` : ''}
            </div>
          </div>

          <div style="background: ${getCropColor(client.cropType)}; color: white; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-weight: 600; font-size: 12px; text-align: center;">
            🌱 ${client.cropType} • ${client.hectares} ha
          </div>

          <div style="display: grid; gap: 6px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
              <span style="color: #64748b;">📞</span>
              <span style="font-weight: 500; color: #475569;">${client.contact}</span>
            </div>
            ${client.email ? `
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                <span style="color: #64748b;">✉️</span>
                <span style="font-weight: 500; color: #475569; font-size: 11px;">${client.email}</span>
              </div>
            ` : ''}
          </div>

          ${dosificationInfo}

          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8;">
            Desde: ${new Date(client.createdAt).toLocaleDateString('es-EC', { month: 'short', day: 'numeric', year: '2-digit' })}
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      })

      if (onClientClick) {
        marker.on('click', () => {
          onClientClick(client)
        })
      }

      marker.addTo(mapRef.current!)
      markersRef.current.set(client.id, marker)
    })
  }, [filteredClients, dosifications, onClientClick])

  useEffect(() => {
    if (!mapRef.current) return

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove()
      selectedMarkerRef.current = null
    }

    if (selectedLocation) {
      const marker = L.marker(
        [selectedLocation.lat, selectedLocation.lng],
        { icon: createSelectedIcon() }
      )
      
      marker.bindPopup(`
        <div style="font-family: 'IBM Plex Sans', sans-serif; text-align: center; padding: 4px;">
          <div style="font-weight: 700; font-size: 15px; color: #FF6B35; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="font-size: 18px;">📍</span>
            <span>Ubicación Seleccionada</span>
          </div>
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 10px; border-radius: 8px; border: 2px solid #e2e8f0;">
            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Coordenadas GPS</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #1e293b; font-weight: 600; line-height: 1.6;">
              <div>Lat: ${selectedLocation.lat.toFixed(6)}</div>
              <div>Lng: ${selectedLocation.lng.toFixed(6)}</div>
            </div>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 8px; font-style: italic;">
            ✓ Haz clic en otro lugar para cambiar
          </div>
        </div>
      `, {
        className: 'custom-popup',
        maxWidth: 280,
        closeButton: false
      }).openPopup()

      marker.addTo(mapRef.current)
      selectedMarkerRef.current = marker

      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13, {
        animate: true,
        duration: 0.8
      })
    }
  }, [selectedLocation])

  return (
    <Card className="relative w-full h-[600px] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={`bg-white hover:bg-gray-100 shadow-md border border-gray-300 text-gray-700 ${
                hasActiveFilters ? 'border-primary text-primary' : ''
              }`}
            >
              <Funnel className="mr-2" size={18} weight={hasActiveFilters ? 'fill' : 'bold'} />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-xs">
                  {selectedCropTypes.size + selectedStatuses.size}
                </Badge>
              )}
              <CaretDown className="ml-2" size={14} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Filtrar Clientes</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  <X size={14} className="mr-1" />
                  Limpiar
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Por Tipo de Cultivo
            </DropdownMenuLabel>
            <div className="max-h-[300px] overflow-y-auto">
              {CROP_TYPES.map((cropType) => (
                <DropdownMenuCheckboxItem
                  key={cropType}
                  checked={selectedCropTypes.has(cropType)}
                  onCheckedChange={() => toggleCropType(cropType)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: getCropColor(cropType) }}
                    />
                    <span className="text-sm">{cropType}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Por Estado
            </DropdownMenuLabel>
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.has(status)}
                onCheckedChange={() => toggleStatus(status)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === 'Activo'
                        ? 'bg-green-600'
                        : status === 'Inactivo'
                        ? 'bg-gray-500'
                        : 'bg-orange-500'
                    }`}
                  />
                  <span>{status}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white hover:bg-gray-100 shadow-md border border-gray-300 text-gray-700"
            >
              <Stack className="mr-2" size={18} weight="bold" />
              {mapType === 'osm' ? 'Mapa Base' : mapType === 'satellite' ? 'Satélite' : 'Híbrido'}
              <CaretDown className="ml-2" size={14} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setMapType('osm')}>
              <MapTrifold className="mr-2" size={18} weight={mapType === 'osm' ? 'fill' : 'regular'} />
              Mapa Base
              {mapType === 'osm' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapType('satellite')}>
              <Globe className="mr-2" size={18} weight={mapType === 'satellite' ? 'fill' : 'regular'} />
              Satélite
              {mapType === 'satellite' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapType('hybrid')}>
              <Stack className="mr-2" size={18} weight={mapType === 'hybrid' ? 'fill' : 'regular'} />
              Híbrido
              {mapType === 'hybrid' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg text-xs space-y-2 z-[1000] border border-gray-200">
        <div className="font-semibold mb-2 text-gray-700">Leyenda de Cultivos</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: getCropColor('Flores') }}></div>
          <span className="text-gray-600">Flores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: getCropColor('Hortalizas') }}></div>
          <span className="text-gray-600">Hortalizas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: getCropColor('Frutas') }}></div>
          <span className="text-gray-600">Frutas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: getCropColor('Granos') }}></div>
          <span className="text-gray-600">Granos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: getCropColor('Tubérculos') }}></div>
          <span className="text-gray-600">Tubérculos</span>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-sm font-semibold shadow-md z-[1000] border border-gray-200">
        <span className="text-primary">🗺️ Ecuador</span>
        <span className="text-gray-500 ml-2">
          · {filteredClients.filter(c => c.location).length} de {clients.filter(c => c.location).length} clientes
          {hasActiveFilters && ' (filtrados)'}
        </span>
      </div>
    </Card>
  )
}
