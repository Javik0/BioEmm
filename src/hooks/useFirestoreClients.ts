import { useEffect, useMemo, useState } from 'react'
import type { Client } from '@/types'
import { deleteClient as deleteClientDoc, subscribeClientsWithError, upsertClient } from '@/lib/firestoreClients'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'

export function useFirestoreClients() {
  const { user, loading: authLoading } = useFirebaseAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setClients([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeClientsWithError(
      (c) => {
        setClients(c)
        setLoading(false)
      },
      (err) => {
        const message = (err as any)?.message || 'No se pudo leer clientes (Firestore)'
        setError(message)
        setClients([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [authLoading, user?.uid])

  return useMemo(
    () => ({
      clients,
      loading,
      error,
      upsertClient,
      deleteClient: deleteClientDoc,
    }),
    [clients, loading, error]
  )
}
