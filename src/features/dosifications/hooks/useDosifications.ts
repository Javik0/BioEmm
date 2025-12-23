import { useState, useEffect } from 'react'
import { Dosification } from '@/types'
import { dosificationsService } from '../services/firestoreDosifications'
import { toast } from 'sonner'

export function useDosifications() {
  const [dosifications, setDosifications] = useState<Dosification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = dosificationsService.subscribe(
      (data) => {
        setDosifications(data)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching dosifications:', err)
        setError(err)
        setLoading(false)
        toast.error('Error al cargar las dosificaciones')
      }
    )

    return () => unsubscribe()
  }, [])

  const addDosification = async (dosification: Omit<Dosification, 'id'>) => {
    try {
      await dosificationsService.add(dosification)
      return true
    } catch (err) {
      console.error('Error adding dosification:', err)
      toast.error('Error al guardar la dosificación')
      return false
    }
  }

  const updateDosification = async (id: string, data: Partial<Dosification>) => {
    try {
      await dosificationsService.update(id, data)
      return true
    } catch (err) {
      console.error('Error updating dosification:', err)
      toast.error('Error al actualizar la dosificación')
      return false
    }
  }

  const deleteDosification = async (id: string) => {
    try {
      await dosificationsService.delete(id)
      return true
    } catch (err) {
      console.error('Error deleting dosification:', err)
      toast.error('Error al eliminar la dosificación')
      return false
    }
  }

  return {
    dosifications,
    loading,
    error,
    addDosification,
    updateDosification,
    deleteDosification
  }
}
