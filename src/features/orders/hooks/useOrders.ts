import { useEffect, useMemo, useState } from 'react'
import { Order } from '@/types'
import { addOrder, subscribeOrders, subscribeOrdersByClient, updateOrder } from '../services/firestoreOrders'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { toast } from 'sonner'

interface UseOrdersOptions {
  clientId?: string
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { clientId } = options
  const { user, loading: authLoading } = useFirebaseAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setOrders([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = clientId
      ? subscribeOrdersByClient(
          clientId,
          (data) => {
            setOrders(data)
            setLoading(false)
          },
          (err) => {
            setError(err)
            setLoading(false)
            toast.error('No se pudieron cargar las órdenes del cliente')
          }
        )
      : subscribeOrders(
          (data) => {
            setOrders(data)
            setLoading(false)
          },
          (err) => {
            setError(err)
            setLoading(false)
            toast.error('No se pudieron cargar las órdenes')
          }
        )

    return () => unsub()
  }, [authLoading, user?.uid, clientId])

  return useMemo(
    () => ({
      orders,
      loading,
      error,
      addOrder,
      updateOrder,
    }),
    [orders, loading, error]
  )
}
