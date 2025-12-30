import { useMemo } from 'react'
import { useDosifications } from '@/features/dosifications'
import { useVisits } from '@/features/visits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDosificationActions } from '@/features/dosifications/hooks/useDosificationActions'
import { useVisitActions } from '@/features/visits/hooks/useVisitActions'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function daysDiff(from: string, to = new Date()) {
  const a = new Date(from).getTime()
  const b = to.getTime()
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

export default function AlertsPage() {
  const { dosifications, updateDosification } = useDosifications()
  const { visits, updateVisit } = useVisits()
  const { markDosificationCompleted } = useDosificationActions(updateDosification)
  const { markVisitCompleted } = useVisitActions(updateVisit)

  const now = new Date()

  const { overdueVisits, upcomingVisits, overdueDosifications, upcomingDosifications, nextApplications } = useMemo(() => {
    const overdueVisits = visits.filter((v) => v.status === 'Programada' && new Date(v.scheduledDate).getTime() < now.getTime())
    const upcomingVisits = visits.filter((v) => v.status === 'Programada' && new Date(v.scheduledDate).getTime() >= now.getTime())

    const overdueDosifications = dosifications.filter((d) => d.status === 'Pendiente' && new Date(d.date).getTime() < now.getTime())
    const upcomingDosifications = dosifications.filter((d) => d.status === 'Pendiente' && new Date(d.date).getTime() >= now.getTime())

    const nextApplications = dosifications
      .filter((d) => d.status !== 'Pendiente' && d.nextApplicationDate)
      .sort((a, b) => new Date(a.nextApplicationDate || '').getTime() - new Date(b.nextApplicationDate || '').getTime())

    return {
      overdueVisits,
      upcomingVisits,
      overdueDosifications,
      upcomingDosifications,
      nextApplications,
    }
  }, [dosifications, visits, now])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">Visitas pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[420px] pr-4 space-y-3">
            {overdueVisits.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 bg-red-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{v.clientName}</p>
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                  </div>
                  <Badge className="bg-red-600 text-white">Vencida</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Programada: {formatDate(v.scheduledDate)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => markVisitCompleted(v)}>Marcar completada</Button>
                </div>
              </div>
            ))}

            {upcomingVisits.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{v.clientName}</p>
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                  </div>
                  <Badge variant="outline">En {daysDiff(v.scheduledDate, now)} días</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Programada: {formatDate(v.scheduledDate)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => markVisitCompleted(v)}>Marcar completada</Button>
                </div>
              </div>
            ))}

            {overdueVisits.length === 0 && upcomingVisits.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Sin recordatorios de visitas.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">Dosificaciones y reaplicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[420px] pr-4 space-y-3">
            {overdueDosifications.map((d) => (
              <div key={d.id} className="border rounded-lg p-3 bg-red-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{d.clientName}</p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                  <Badge className="bg-red-600 text-white">Vencida</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Programada: {formatDate(d.date)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => markDosificationCompleted(d)}>Marcar completada</Button>
                </div>
              </div>
            ))}

            {upcomingDosifications.map((d) => (
              <div key={d.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{d.clientName}</p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                  <Badge variant="outline">En {daysDiff(d.date, now)} días</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Programada: {formatDate(d.date)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => markDosificationCompleted(d)}>Marcar completada</Button>
                </div>
              </div>
            ))}

            {nextApplications.map((d) => (
              <div key={`${d.id}-next`} className="border rounded-lg p-3 bg-yellow-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{d.clientName}</p>
                    <p className="text-xs text-muted-foreground">Reaplicación sugerida</p>
                  </div>
                  <Badge className="bg-yellow-600 text-white">{formatDate(d.nextApplicationDate!)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Hace {Math.abs(daysDiff(d.date, now))} días se aplicó la última dosis.</p>
              </div>
            ))}

            {overdueDosifications.length === 0 && upcomingDosifications.length === 0 && nextApplications.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Sin recordatorios de dosificación.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
