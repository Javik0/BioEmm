import { collection, addDoc, onSnapshot, query, orderBy, where, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order } from '@/types'

const COLLECTION_NAME = 'orders'

export async function addOrder(order: Omit<Order, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), order)
  return docRef.id
}

export async function updateOrder(order: Order): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, order.id)
  await setDoc(docRef, order)
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('orderDate', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      onData(orders)
    },
    onError
  )
}

export function subscribeOrdersByClient(
  clientId: string,
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('clientId', '==', clientId),
    orderBy('orderDate', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      onData(orders)
    },
    onError
  )
}
