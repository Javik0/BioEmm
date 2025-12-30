import { useEffect, useMemo, useRef, useState } from 'react'
import { useClients } from '@/features/clients'
import { useVisits } from '@/features/visits'
import { useUsers } from '@/features/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CalendarDots, MapPin, Phone, WhatsappLogo, CheckCircle, XCircle, Clock, ArrowsClockwise, CalendarBlank, BellRinging, List as ListIcon, CaretLeft, CaretRight } from '@phosphor-icons/react'
import type { Visit, VisitStatus } from '@/types'
import { toast } from 'sonner'

const STATUS_BADGES: Record<VisitStatus, { label: string; className: string }> = {
  Programada: { label: 'Programada', className: 'bg-blue-100 text-blue-700' },
  Reprogramada: { label: 'Reprogramada', className: 'bg-amber-100 text-amber-700' },
  Completada: { label: 'Completada', className: 'bg-green-100 text-green-700' },
  Cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700' }
}

const REMINDER_MINUTES = [60, 15] // minutos antes de la visita

function buildDateTime(visit: Visit): Date {
  // scheduledDate puede venir con o sin hora; si hay scheduledTime se combina
  if (visit.scheduledTime) {
    const baseDate = visit.scheduledDate.split('T')[0]
    return new Date(`${baseDate}T${visit.scheduledTime}`)
  }
  return new Date(visit.scheduledDate)
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
  const { users } = useUsers()
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<'unsupported' | 'default' | 'granted' | 'denied'>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as 'default' | 'granted' | 'denied'
  })
  const reminderTimers = useRef<number[]>([])
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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

    const filteredByAssignee = assignedFilter === 'all'
      ? filtered
      : filtered.filter((v) => (v.assignedTo || '').toLowerCase() === assignedFilter.toLowerCase())

    const filteredByDate = filteredByAssignee.filter((v) => {
      const ts = buildDateTime(v).getTime()
      if (!Number.isFinite(ts)) return false
      if (startDate) {
        const startTs = new Date(startDate).setHours(0, 0, 0, 0)
        if (ts < startTs) return false
      }
      if (endDate) {
        const endTs = new Date(endDate).setHours(23, 59, 59, 999)
        if (ts > endTs) return false
      }
      return true
    })

    const sorted = [...filteredByDate].sort((a, b) => buildDateTime(a).getTime() - buildDateTime(b).getTime())

    return sorted.reduce<Record<string, typeof sorted>>((acc, visit) => {
      const key = visit.scheduledDate.split('T')[0]
      if (!acc[key]) acc[key] = []
      acc[key].push(visit)
      return acc
    }, {})
  }, [visitsWithClient, tab, assignedFilter, startDate, endDate])

  const assignedOptions = useMemo(() => {
    const uniques = new Set<string>()
    users
      .filter((u) => u.status === 'Activo')
      .forEach((u) => uniques.add(u.displayName))

    visitsWithClient.forEach((v) => {
      if (v.assignedTo) uniques.add(v.assignedTo)
    })

    return Array.from(uniques).sort((a, b) => a.localeCompare(b))
  }, [users, visitsWithClient])

  // Recordatorios in-app (y Notification API si el usuario lo permite)
  useEffect(() => {
    // limpiar timers previos
    reminderTimers.current.forEach((t) => clearTimeout(t))
    reminderTimers.current = []

    const pending = visitsWithClient.filter((v) => v.status === 'Programada' || v.status === 'Reprogramada')

    const now = Date.now()
    const horizon = now + 48 * 60 * 60 * 1000 // 48h adelante para evitar demasiados timers

    pending.forEach((visit) => {
      const visitDate = buildDateTime(visit).getTime()
      if (!Number.isFinite(visitDate) || visitDate <= now || visitDate > horizon) return

      REMINDER_MINUTES.forEach((minutes) => {
        const fireAt = visitDate - minutes * 60 * 1000
        const delay = fireAt - Date.now()
        if (delay <= 0) return

        const id = window.setTimeout(() => {
          const title = `Visita en ${minutes} min`
          const body = `${visit.clientName} • ${visit.type} • ${new Date(visitDate).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`

          if (notificationStatus === 'granted' && typeof Notification !== 'undefined') {
            new Notification(title, { body })
          } else {
            toast.info(body)
          }
        }, delay)

        reminderTimers.current.push(id)
      })
    })

    return () => {
      reminderTimers.current.forEach((t) => clearTimeout(t))
      reminderTimers.current = []
    }
  }, [visitsWithClient, notificationStatus])

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationStatus('unsupported')
      toast.info('Tu navegador no soporta notificaciones')
      return
    }
    if (Notification.permission === 'granted') {
      setNotificationStatus('granted')
      toast.success('Notificaciones ya habilitadas')
      return
    }
    const result = await Notification.requestPermission()
    setNotificationStatus(result as any)
    if (result === 'granted') {
      toast.success('Notificaciones habilitadas para recordatorios')
    } else if (result === 'denied') {
      toast.info('No se habilitaron notificaciones; usaré avisos in-app')
    }
  }

  const handleStatusChange = async (visit: Visit, status: VisitStatus) => {
    await updateVisit({ ...visit, status, completedAt: status === 'Completada' ? new Date().toISOString() : visit.completedAt })
  }

  // Datos para calendario
  const today = new Date()
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const month = currentMonthDate.getMonth()
  const year = currentMonthDate.getFullYear()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = new Date(year, month, 1).getDay() // 0 domingo

  const dayKeysInMonth = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const iso = new Date(year, month, day).toISOString().split('T')[0]
    return iso
  })

  const countsByDay = dayKeysInMonth.reduce<Record<string, number>>((acc, key) => {
    acc[key] = grouped[key]?.length || 0
    return acc
  }, {})

  const selectedDayVisits = selectedDay ? grouped[selectedDay] || [] : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDots size={20} />
            Agenda de visitas
          </h2>
          <p className="text-sm text-muted-foreground">Pendientes por defecto; recordatorios a 60 y 15 min antes si el navegador lo permite.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant={notificationStatus === 'granted' ? 'outline' : 'default'}
            size="sm"
            onClick={requestNotificationPermission}
            disabled={notificationStatus === 'unsupported'}
          >
            <BellRinging size={16} className="mr-1" />
            {notificationStatus === 'granted' ? 'Notificaciones activas' : 'Habilitar recordatorios'}
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <ListIcon size={16} className="mr-1" /> Lista
          </Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')}>
            <CalendarBlank size={16} className="mr-1" /> Calendario
          </Button>
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

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs text-muted-foreground">Técnico / asignado</label>
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {assignedOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-44">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setAssignedFilter('all'); setStartDate(''); setEndDate(''); }}>
          Limpiar filtros
        </Button>
      </div>

      {view === 'list' && (
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
                          {visit.assignedTo && (
                            <div className="text-xs text-muted-foreground">Asignado: <span className="font-medium text-foreground">{visit.assignedTo}</span></div>
                          )}
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
      )}

      {view === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMonthOffset((m) => m - 1)}>
                <CaretLeft size={16} />
              </Button>
              <div className="font-semibold">
                {currentMonthDate.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMonthOffset((m) => m + 1)}>
                <CaretRight size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRinging size={16} /> Recordatorios: 60 y 15 min antes
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 border border-dashed border-muted/40 rounded" />
            ))}
            {dayKeysInMonth.map((dayKey, idx) => {
              const dayNum = idx + 1
              const count = countsByDay[dayKey]
              const isSelected = selectedDay === dayKey
              const hasVisits = count > 0
              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDay(dayKey)}
                  className={`h-16 w-full border rounded p-2 text-left flex flex-col justify-between transition ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : hasVisits
                        ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                        : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <span className="text-sm font-semibold">{dayNum}</span>
                  {count > 0 && (
                    <span className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {count} visita{count > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            {selectedDay && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock size={16} />
                    {formatDate(selectedDay)}
                    <Badge variant="secondary" className="ml-2">{selectedDayVisits.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDayVisits.length === 0 && <div className="text-sm text-muted-foreground">Sin visitas para este día.</div>}
                  {selectedDayVisits.map((visit) => {
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
                            {visit.assignedTo && (
                              <div className="text-xs text-muted-foreground">Asignado: <span className="font-medium text-foreground">{visit.assignedTo}</span></div>
                            )}
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
            )}
            {!selectedDay && (
              <div className="text-sm text-muted-foreground">Selecciona un día para ver sus visitas.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
