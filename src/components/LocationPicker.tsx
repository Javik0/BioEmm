import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapTrifold, Copy, Check, MapPin } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LocationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationSelect: (location: { lat: number; lng: number }) => void
  initialLocation?: { lat: number; lng: number }
}

const createPinIcon = () => {
  const svgIcon = `
    <svg width="50" height="70" viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="6" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#16a34a;stop-opacity:0" />
        </radialGradient>
      </defs>
      <!-- Pulse animation circle -->
      <g filter="url(#shadow)">
        <circle cx="25" cy="25" r="25" fill="url(#pulseGradient)">
          <animate attributeName="r" values="25;35" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <!-- Pin -->
        <path d="M25 0C12.85 0 3 9.85 3 22c0 18 22 48 22 48s22-30 22-48c0-12.15-9.85-22-22-22z" 
              fill="url(#pinGradient)" stroke="white" stroke-width="3"/>
        <!-- Inner circle -->
        <circle cx="25" cy="22" r="12" fill="white"/>
        <circle cx="25" cy="22" r="7" fill="#16a34a">
          <animate attributeName="r" values="7;8;7" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'location-picker-pin',
    iconSize: [50, 70],
    iconAnchor: [25, 70],
    popupAnchor: [0, -70]
  })
}

export function LocationPicker({ open, onOpenChange, onLocationSelect, initialLocation }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null)
  const [copied, setCopied] = useState(false)
  const [debugStatus, setDebugStatus] = useState<string>('idle')

  useEffect(() => {
    mapContainerRef.current = mapEl
    if (!open) return
    if (!mapEl) return

    if (import.meta.env.DEV) {
      console.info('[LocationPicker] open=true; container size:', mapEl.getBoundingClientRect())
    }
    setDebugStatus('open')

    // Limpieza defensiva (sin manipular el DOM manualmente)
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null

    const initMap = () => {
      if (cancelled) return
      if (!mapContainerRef.current) return

      // Evitar doble init si Radix re-renderiza durante la transición
      if (mapRef.current) return

      setDebugStatus('init:creating-map')
      if (import.meta.env.DEV) {
        const rect = mapContainerRef.current.getBoundingClientRect()
        console.info('[LocationPicker] initMap() creating Leaflet map; rect=', rect)
      }

      try {
        const map = L.map(mapContainerRef.current, {
          center: initialLocation || [-1.5, -78.5],
          zoom: initialLocation ? 15 : 7,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        })

        map.once('load', () => {
          setDebugStatus('map:load')
          if (import.meta.env.DEV) console.info('[LocationPicker] map load event')
        })

        map.on('tileerror', (e) => {
          if (import.meta.env.DEV) console.warn('[LocationPicker] tileerror', e)
        })

        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 20,
          minZoom: 5
        })

        tiles.on('loading', () => {
          setDebugStatus('tiles:loading')
          if (import.meta.env.DEV) console.info('[LocationPicker] tiles loading')
        })
        tiles.on('load', () => {
          setDebugStatus('tiles:load')
          if (import.meta.env.DEV) console.info('[LocationPicker] tiles load')
        })
        tiles.on('tileerror', (e) => {
          setDebugStatus('tiles:error')
          if (import.meta.env.DEV) console.warn('[LocationPicker] tiles tileerror', e)
          toast.error('No se pudieron cargar los tiles del mapa (red/CORS).')
        })

        tiles.addTo(map)

        map.on('click', (e) => {
          const newLocation = {
            lat: parseFloat(e.latlng.lat.toFixed(8)),
            lng: parseFloat(e.latlng.lng.toFixed(8))
          }
          setSelectedLocation(newLocation)

          if (markerRef.current) {
            markerRef.current.remove()
          }

          const marker = L.marker([newLocation.lat, newLocation.lng], { icon: createPinIcon() })
          marker
            .bindPopup(
              `
                <div style="font-family: 'IBM Plex Sans', sans-serif; text-align: center; padding: 8px;">
                  <div style="font-weight: 700; font-size: 13px; color: #16a34a; margin-bottom: 10px;">📍 Ubicación Seleccionada</div>
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 12px; border-radius: 8px; border: 2px solid #86efac;">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #15803d; font-weight: 600; line-height: 1.8;">
                      <div>Lat: ${newLocation.lat}</div>
                      <div>Lng: ${newLocation.lng}</div>
                    </div>
                  </div>
                </div>
              `,
              { className: 'location-popup', maxWidth: 280 }
            )
            .openPopup()

          marker.addTo(map)
          markerRef.current = marker

          map.setView([newLocation.lat, newLocation.lng], 15, { animate: true, duration: 0.6 })
        })

        if (initialLocation) {
          const marker = L.marker([initialLocation.lat, initialLocation.lng], { icon: createPinIcon() })
          marker.addTo(map)
          markerRef.current = marker
        }

        mapRef.current = map

        // Verificacin rida de que Leaflet mont su DOM
        setTimeout(() => {
          if (cancelled) return
          const el = mapContainerRef.current
          if (!el) return
          const hasLeafletDom = el.classList.contains('leaflet-container') || !!el.querySelector('.leaflet-pane')
          if (import.meta.env.DEV) {
            console.info('[LocationPicker] post-init DOM check:', {
              hasLeafletDom,
              classList: Array.from(el.classList),
              childCount: el.childNodes.length,
            })
          }
          if (!hasLeafletDom) {
            setDebugStatus('init:dom-missing')
          }
        }, 200)

        const invalidate = () => {
          try {
            map.invalidateSize(true)
          } catch {
            // noop
          }
        }

        requestAnimationFrame(invalidate)
        setTimeout(invalidate, 100)
        setTimeout(invalidate, 250)
        setTimeout(invalidate, 500)
        setTimeout(invalidate, 900)

        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(() => invalidate())
          resizeObserver.observe(mapContainerRef.current)
        }
      } catch (error) {
        // Si Leaflet falla al crear, mostramos error y dejamos el modal usable
        console.error(error)
        setDebugStatus('init:error')
        toast.error('No se pudo cargar el mapa. Intenta reabrir el selector.')
      }
    }

    // Esperar a que el contenedor tenga dimensiones reales (en pantallas angostas o con animación del modal)
    const initWhenSized = (attemptsLeft: number) => {
      if (cancelled) return
      const rect = mapEl.getBoundingClientRect()
      if (rect.width >= 200 && rect.height >= 200) {
        initMap()
        return
      }

      if (attemptsLeft <= 0) {
        initMap()
        return
      }

      requestAnimationFrame(() => initWhenSized(attemptsLeft - 1))
    }

    requestAnimationFrame(() => initWhenSized(60))

    // Fallback: si por alguna razn el chequeo de tamao no dispara en este modal,
    // intentamos inicializar de todas formas.
    setTimeout(() => initMap(), 50)

    return () => {
      cancelled = true
      if (resizeObserver) resizeObserver.disconnect()
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [open, initialLocation, mapEl])

  const handleCopyCoordinates = () => {
    if (!selectedLocation) return
    const coords = `${selectedLocation.lat.toFixed(8)}, ${selectedLocation.lng.toFixed(8)}`
    navigator.clipboard.writeText(coords)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Coordenadas copiadas')
  }

  const handleConfirm = () => {
    if (!selectedLocation) {
      toast.error('Selecciona una ubicación en el mapa')
      return
    }
    onLocationSelect(selectedLocation)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[95vh] h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <MapPin size={28} weight="duotone" />
              Seleccionar Ubicación en Mapa
            </DialogTitle>
            <DialogDescription>
              Haz clic en el mapa para marcar la ubicación exacta del cliente
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content con mapa y panel */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden px-6 py-4">
          {/* Mapa */}
          <div className="relative flex-1 min-h-[320px] lg:min-h-0 min-w-0">
            <div
              ref={setMapEl}
              className="h-full w-full min-h-[320px] rounded-lg border-2 border-primary/20 overflow-hidden shadow-lg bg-gray-50"
            />

            {import.meta.env.DEV && (
              <div className="pointer-events-none absolute left-3 top-3 z-[1001] rounded-md bg-black/70 px-2 py-1 text-xs text-white">
                {debugStatus}
              </div>
            )}

            {/* Barra inferior (móvil) */}
            <div className="lg:hidden absolute left-3 right-3 bottom-3 rounded-lg border bg-white/95 backdrop-blur shadow-lg p-3">
              {selectedLocation ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">Coordenadas</div>
                    <div className="font-mono text-sm font-bold truncate">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyCoordinates} className="shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Toca el mapa para fijar el punto.
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral (desktop) */}
          <div className="hidden lg:flex w-96 flex-col gap-3 overflow-y-auto pr-2">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <MapTrifold size={20} className="text-green-700" />
                <h3 className="font-semibold text-green-900">Coordenadas GPS</h3>
              </div>

              {selectedLocation ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                    <div className="text-xs text-gray-600 font-semibold mb-1 tracking-wide">LATITUD</div>
                    <div className="font-mono text-lg font-bold text-green-700 break-all">
                      {selectedLocation.lat.toFixed(8)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                    <div className="text-xs text-gray-600 font-semibold mb-1 tracking-wide">LONGITUD</div>
                    <div className="font-mono text-lg font-bold text-green-700 break-all">
                      {selectedLocation.lng.toFixed(8)}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCoordinates}
                    className="w-full border-green-300 hover:bg-green-100 text-sm"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="mr-2" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copiar Coordenadas
                      </>
                    )}
                  </Button>

                  <Badge className="w-full justify-center bg-green-600 py-2 text-sm">
                    ✓ Ubicación seleccionada
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-green-300">
                  <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-600">
                    Haz clic en el mapa para seleccionar una ubicación
                  </p>
                </div>
              )}
            </Card>

            {/* Instrucciones */}
            <Card className="p-4 bg-blue-50 border-blue-200 flex-shrink-0">
              <h4 className="font-semibold text-sm text-blue-900 mb-3">💡 Instrucciones:</h4>
              <ul className="text-xs text-blue-800 space-y-2 leading-relaxed">
                <li>✓ Haz clic en el mapa para marcar</li>
                <li>✓ Usa zoom para mayor precisión</li>
                <li>✓ Arrastra para desplazarte</li>
                <li>✓ Las coordenadas se actualizan al instante</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="bg-green-600 hover:bg-green-700"
          >
            <MapPin size={18} className="mr-2" />
            Confirmar Ubicación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
