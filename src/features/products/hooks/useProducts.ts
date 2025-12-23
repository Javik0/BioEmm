import { useEffect, useMemo, useState } from 'react'
import type { Product } from '@/types'
import { deleteProduct as deleteProductDoc, subscribeProductsWithError, upsertProduct } from '../services/firestoreProducts'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'

export function useProducts() {
  const { user, loading: authLoading } = useFirebaseAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setProducts([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeProductsWithError(
      (p) => {
        setProducts(p)
        setLoading(false)
      },
      (err) => {
        const message = (err as any)?.message || 'No se pudo leer productos (Firestore)'
        setError(message)
        setProducts([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [authLoading, user?.uid])

  return useMemo(
    () => ({
      products,
      loading,
      error,
      upsertProduct,
      deleteProduct: deleteProductDoc,
    }),
    [products, loading, error]
  )
}
