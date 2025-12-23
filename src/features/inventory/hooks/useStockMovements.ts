import { useState, useEffect } from 'react'
import { StockMovement } from '@/types'
import { stockMovementsService } from '../services/firestoreStockMovements'
import { toast } from 'sonner'

export function useStockMovements(productId?: string) {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = productId 
      ? stockMovementsService.subscribeByProduct(
          productId,
          (data) => {
            setStockMovements(data)
            setLoading(false)
          },
          (err) => {
            console.error('Error fetching stock movements:', err)
            setError(err)
            setLoading(false)
          }
        )
      : stockMovementsService.subscribe(
          (data) => {
            setStockMovements(data)
            setLoading(false)
          },
          (err) => {
            console.error('Error fetching stock movements:', err)
            setError(err)
            setLoading(false)
            toast.error('Error al cargar los movimientos de stock')
          }
        )

    return () => unsubscribe()
  }, [productId])

  const addStockMovement = async (movement: Omit<StockMovement, 'id'>) => {
    try {
      await stockMovementsService.add(movement)
      return true
    } catch (err) {
      console.error('Error adding stock movement:', err)
      toast.error('Error al registrar el movimiento de stock')
      return false
    }
  }

  return {
    stockMovements,
    loading,
    error,
    addStockMovement
  }
}
