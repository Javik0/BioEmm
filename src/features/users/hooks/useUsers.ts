import { useEffect, useState } from 'react'
import { usersService } from '../services/firestoreUsers'
import type { User } from '@/types'
import { toast } from 'sonner'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    const unsubscribe = usersService.subscribe(
      (data) => {
        setUsers(data)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching users:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Error al cargar los usuarios')
      }
    )

    return () => unsubscribe()
  }, [])

  return { users, loading, error }
}
