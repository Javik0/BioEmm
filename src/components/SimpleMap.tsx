import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Client, Dosification } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, MapTrifold, Stack, CaretDown } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SimpleMapProps {
  clients: Client[]
  dosifications?: Dosification[]
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

export function SimpleMap({ clients, dosifications = [], onClientClick, onMapClick, selectedLocation }: SimpleMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const selectedMarkerRef = useRef<L.Marker | null>(null)
  const baseLayersRef = useRef<{ osm: L.TileLayer; satellite: L.TileLayer; hybrid: L.TileLayer } | null>(null)
  
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'hybrid'>('osm')

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

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    clients.forEach(client => {
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
        : '<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">INACTIVO</span>'

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
        <div style="font-family: 'IBM Plex Sans', sans-serif; min-width: 220px; max-width: 280px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div style="font-weight: 600; font-size: 15px; color: #1a1a1a; line-height: 1.2;">
              ${client.name}
            </div>
            ${statusBadge}
          </div>
          
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; background: ${getCropColor(client.cropType)}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">
              ${client.cropType}
            </span>
          </div>

          <div style="display: grid; gap: 6px; margin-top: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
              <span style="color: #64748b; min-width: 65px;">📏 Hectáreas:</span>
              <span style="font-weight: 600; color: #1e293b; font-family: 'JetBrains Mono', monospace;">${client.hectares} ha</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
              <span style="color: #64748b; min-width: 65px;">📞 Contacto:</span>
              <span style="font-weight: 500; color: #475569;">${client.contact}</span>
            </div>
            ${client.email ? `
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                <span style="color: #64748b; min-width: 65px;">✉️ Email:</span>
                <span style="font-weight: 500; color: #475569; font-size: 11px;">${client.email}</span>
              </div>
            ` : ''}
          </div>

          ${dosificationInfo}

          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8;">
            Registrado: ${new Date(client.createdAt).toLocaleDateString('es-EC', { month: 'short', day: 'numeric', year: 'numeric' })}
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
  }, [clients, dosifications, onClientClick])

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
      
      <div className="absolute top-4 right-4 z-[1000]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="bg-white/95 backdrop-blur shadow-lg border border-gray-200 hover:bg-white"
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
        <span className="text-gray-500 ml-2">· {clients.filter(c => c.location).length} clientes ubicados</span>
      </div>
    </Card>
  )
}
