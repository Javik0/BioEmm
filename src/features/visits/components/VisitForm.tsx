import { useState, useEffect } from 'react'
import { Visit, VISIT_TYPES, VisitType, Client } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface VisitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (visit: Omit<Visit, 'id' | 'createdAt' | 'status'>) => void
  client: Client
  editVisit?: Visit
}

export function VisitForm({ open, onOpenChange, onSubmit, client, editVisit }: VisitFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState('09:00')
  const [type, setType] = useState<VisitType>('Seguimiento')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      if (editVisit) {
        setDate(new Date(editVisit.scheduledDate))
        setTime(editVisit.scheduledTime || '09:00')
        setType(editVisit.type)
        setNotes(editVisit.notes || '')
      } else {
        setDate(new Date())
        setTime('09:00')
        setType('Seguimiento')
        setNotes('')
      }
    }
  }, [open, editVisit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    onSubmit({
      clientId: client.id,
      clientName: client.name,
      scheduledDate: date.toISOString(),
      scheduledTime: time,
      type,
      notes
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editVisit ? 'Editar Visita' : 'Programar Visita'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={client.name} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Visita</Label>
            <Select value={type} onValueChange={(v) => setType(v as VisitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales de la visita..."
            />
          </div>

          <DialogFooter>
            <Button type="submit">{editVisit ? 'Guardar Cambios' : 'Programar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
