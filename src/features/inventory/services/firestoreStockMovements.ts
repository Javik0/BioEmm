import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { StockMovement } from '@/types'

const COLLECTION_NAME = 'stock_movements'

export const stockMovementsService = {
  subscribe: (onData: (data: StockMovement[]) => void, onError: (error: Error) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StockMovement[]
        onData(data)
      },
      onError
    )
  },

  add: async (movement: Omit<StockMovement, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), movement)
    return docRef.id
  },

  // Optional: Get movements by product
  subscribeByProduct: (productId: string, onData: (data: StockMovement[]) => void, onError: (error: Error) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StockMovement[]
        onData(data)
      },
      onError
    )
  }
}
