import { useState, useEffect } from 'react'
import { Visit } from '@/types'
import { visitsService } from '../services/firestoreVisits'
import { toast } from 'sonner'

export function useVisits(clientId?: string) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = clientId
      ? visitsService.subscribeByClient(
          clientId,
          (data) => {
            setVisits(data)
            setLoading(false)
          },
          (err) => {
            console.error('Error fetching visits:', err)
            setError(err as Error)
            setLoading(false)
            toast.error('Error al cargar las visitas')
          }
        )
      : visitsService.subscribe(
          (data) => {
            setVisits(data)
            setLoading(false)
          },
          (err) => {
            console.error('Error fetching visits:', err)
            setError(err as Error)
            setLoading(false)
            toast.error('Error al cargar las visitas')
          }
        )

    return () => unsubscribe()
  }, [clientId])

  const addVisit = async (visit: Omit<Visit, 'id'>) => {
    try {
      await visitsService.add(visit)
      toast.success('Visita programada correctamente')
      return true
    } catch (err) {
      console.error('Error adding visit:', err)
      toast.error('Error al programar la visita')
      return false
    }
  }

  const updateVisit = async (visit: Visit) => {
    try {
      await visitsService.update(visit)
      toast.success('Visita actualizada correctamente')
      return true
    } catch (err) {
      console.error('Error updating visit:', err)
      toast.error('Error al actualizar la visita')
      return false
    }
  }

  const deleteVisit = async (id: string) => {
    try {
      await visitsService.delete(id)
      toast.success('Visita eliminada correctamente')
      return true
    } catch (err) {
      console.error('Error deleting visit:', err)
      toast.error('Error al eliminar la visita')
      return false
    }
  }

  return {
    visits,
    loading,
    error,
    addVisit,
    updateVisit,
    deleteVisit
  }
}
