import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Client } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, MapTrifold } from '@phosphor-icons/react'

interface SimpleMapProps {
  clients: Client[]
  onClientClick?: (client: Client) => void
  onMapClick?: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
}

const getCropColor = (cropType: string) => {
  const colors: Record<string, string> = {
    'Flores': '#ec4899',
    'Hortalizas': '#16a34a',
    'Frutas': '#f97316',
    'Granos': '#ca8a04',
    'Tubérculos': '#b45309',
    'Otro': '#6b7280'
  }
  return colors[cropType] || '#6b7280'
}

const createCustomIcon = (color: string) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  })
}

const createSelectedIcon = () => {
  const svgIcon = `
    <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C11.163 0 4 7.163 4 16c0 12 16 36 16 36s16-24 16-36c0-8.837-7.163-16-16-16z" 
            fill="#E87D3E" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="16" r="8" fill="white"/>
      <circle cx="20" cy="16" r="4" fill="#E87D3E"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker selected-marker',
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52]
  })
}

export function SimpleMap({ clients, onClientClick, onMapClick, selectedLocation }: SimpleMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const selectedMarkerRef = useRef<L.Marker | null>(null)
  const baseLayersRef = useRef<{ osm: L.TileLayer; satellite: L.TileLayer } | null>(null)
  
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm')

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

    osmLayer.addTo(map)

    baseLayersRef.current = {
      osm: osmLayer,
      satellite: satelliteLayer
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

    if (mapType === 'osm') {
      mapRef.current.removeLayer(baseLayersRef.current.satellite)
      mapRef.current.addLayer(baseLayersRef.current.osm)
    } else {
      mapRef.current.removeLayer(baseLayersRef.current.osm)
      mapRef.current.addLayer(baseLayersRef.current.satellite)
    }
  }, [mapType])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    clients.forEach(client => {
      if (!client.location) return

      const marker = L.marker(
        [client.location.lat, client.location.lng],
        { icon: createCustomIcon(getCropColor(client.cropType)) }
      )

      const popupContent = `
        <div style="font-family: 'IBM Plex Sans', sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1a1a1a;">
            ${client.name}
          </div>
          <div style="display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 6px; color: #475569;">
            ${client.cropType}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            📍 ${client.hectares} hectáreas
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            ${client.contact}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)

      if (onClientClick) {
        marker.on('click', () => {
          onClientClick(client)
        })
      }

      marker.addTo(mapRef.current!)
      markersRef.current.set(client.id, marker)
    })
  }, [clients, onClientClick])

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
        <div style="font-family: 'IBM Plex Sans', sans-serif; text-align: center;">
          <div style="font-weight: 600; font-size: 13px; color: #E87D3E;">
            📍 Nueva Ubicación
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}
          </div>
        </div>
      `).openPopup()

      marker.addTo(mapRef.current)
      selectedMarkerRef.current = marker

      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 12, {
        animate: true,
        duration: 0.5
      })
    }
  }, [selectedLocation])

  return (
    <Card className="relative w-full h-[600px] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <Button
          size="sm"
          variant={mapType === 'osm' ? 'default' : 'outline'}
          onClick={() => setMapType('osm')}
          className={mapType === 'osm' ? 'bg-primary shadow-lg' : 'bg-white/95 backdrop-blur shadow-md'}
        >
          <MapTrifold className="mr-2" size={18} weight={mapType === 'osm' ? 'fill' : 'regular'} />
          Mapa
        </Button>
        <Button
          size="sm"
          variant={mapType === 'satellite' ? 'default' : 'outline'}
          onClick={() => setMapType('satellite')}
          className={mapType === 'satellite' ? 'bg-primary shadow-lg' : 'bg-white/95 backdrop-blur shadow-md'}
        >
          <Globe className="mr-2" size={18} weight={mapType === 'satellite' ? 'fill' : 'regular'} />
          Satélite
        </Button>
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
        <span className="text-gray-500 ml-2">· {clients.filter(c => c.location).length} clientes ubicados</span>
      </div>
    </Card>
  )
}
