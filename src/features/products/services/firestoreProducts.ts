import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Product } from '@/types'

const COLLECTION_NAME = 'products'

export async function upsertProduct(product: Product): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, product.id)
  await setDoc(docRef, product)
}

export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, productId)
  await deleteDoc(docRef)
}

export function subscribeProductsWithError(
  onData: (products: Product[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
  
  return onSnapshot(
    q,
    (snapshot) => {
      const products: Product[] = []
      snapshot.forEach((doc) => {
        products.push({ ...doc.data(), id: doc.id } as Product)
      })
      onData(products)
    },
    onError
  )
}
