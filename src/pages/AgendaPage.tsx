import { useMemo, useState } from 'react'
import { useClients } from '@/features/clients'
import { useVisits } from '@/features/visits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDots, MapPin, Phone, WhatsappLogo, CheckCircle, XCircle, Clock, ArrowsClockwise } from '@phosphor-icons/react'
import type { Visit, VisitStatus } from '@/types'

const STATUS_BADGES: Record<VisitStatus, { label: string; className: string }> = {
  Programada: { label: 'Programada', className: 'bg-blue-100 text-blue-700' },
  Reprogramada: { label: 'Reprogramada', className: 'bg-amber-100 text-amber-700' },
  Completada: { label: 'Completada', className: 'bg-green-100 text-green-700' },
  Cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700' }
}

function formatDate(dateIso: string) {
  const d = new Date(dateIso)
  return d.toLocaleDateString('es-EC', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(dateIso: string, time?: string) {
  if (time) return time
  const d = new Date(dateIso)
  return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function getGoogleMapsUrl(lat?: number, lng?: number, address?: string) {
  if (lat == null || lng == null) return null
  const dest = `${lat},${lng}`
  const query = address ? encodeURIComponent(address) : dest
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=&query=${query}`
}

export default function AgendaPage() {
  const { clients } = useClients()
  const { visits, updateVisit } = useVisits()
  const [tab, setTab] = useState<'pending' | 'all'>('pending')

  const visitsWithClient = useMemo(() => {
    return visits.map((v) => {
      const client = clients.find((c) => c.id === v.clientId)
      return {
        ...v,
        clientPhone: client?.phone,
        clientLocation: client?.location,
        clientStatus: client?.status,
        clientAddress: client?.location?.address
      }
    })
  }, [visits, clients])

  const grouped = useMemo(() => {
    const filtered = visitsWithClient.filter((v) =>
      tab === 'pending' ? (v.status === 'Programada' || v.status === 'Reprogramada') : true
    )

    const sorted = [...filtered].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

    return sorted.reduce<Record<string, typeof sorted>>((acc, visit) => {
      const key = visit.scheduledDate.split('T')[0]
      if (!acc[key]) acc[key] = []
      acc[key].push(visit)
      return acc
    }, {})
  }, [visitsWithClient, tab])

  const handleStatusChange = async (visit: Visit, status: VisitStatus) => {
    await updateVisit({ ...visit, status, completedAt: status === 'Completada' ? new Date().toISOString() : visit.completedAt })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDots size={20} />
            Agenda de visitas
          </h2>
          <p className="text-sm text-muted-foreground">Pendientes por defecto; incluye acceso directo a navegación y contacto.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" />
        <TabsContent value="all" />
      </Tabs>

      <div className="space-y-4">
        {Object.entries(grouped).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay visitas en esta vista.
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([dateKey, items]) => (
          <Card key={dateKey} className="border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} />
                {formatDate(dateKey)}
                <Badge variant="secondary" className="ml-2">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((visit) => {
                const statusMeta = STATUS_BADGES[visit.status]
                const mapsUrl = getGoogleMapsUrl(visit.clientLocation?.lat, visit.clientLocation?.lng, visit.clientAddress)
                return (
                  <div key={visit.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                          <Badge variant="outline">{visit.type}</Badge>
                        </div>
                        <div className="mt-1 font-semibold text-base">{visit.clientName}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(visit.scheduledDate, visit.scheduledTime)}</div>
                        {visit.notes && <div className="text-sm mt-1 text-foreground/80">{visit.notes}</div>}
                      </div>
                      <div className="flex gap-2">
                        {mapsUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={mapsUrl} target="_blank" rel="noreferrer">
                              <MapPin size={16} className="mr-1" /> Navegar
                            </a>
                          </Button>
                        )}
                        {visit.clientPhone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${visit.clientPhone}`}>
                              <Phone size={16} className="mr-1" /> Llamar
                            </a>
                          </Button>
                        )}
                        {visit.clientPhone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://wa.me/${visit.clientPhone}`} target="_blank" rel="noreferrer">
                              <WhatsappLogo size={16} className="mr-1" /> WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(visit.status === 'Programada' || visit.status === 'Reprogramada') && (
                        <Button size="sm" variant="default" onClick={() => handleStatusChange(visit, 'Completada')}>
                          <CheckCircle size={16} className="mr-1" /> Marcar como hecha
                        </Button>
                      )}
                      {(visit.status === 'Programada' || visit.status === 'Reprogramada') && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(visit, 'Cancelada')}>
                          <XCircle size={16} className="mr-1" /> Cancelar
                        </Button>
                      )}
                      {visit.status === 'Cancelada' && (
                        <Button size="sm" variant="secondary" onClick={() => handleStatusChange(visit, 'Reprogramada')}>
                          <ArrowsClockwise size={16} className="mr-1" /> Reprogramar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
