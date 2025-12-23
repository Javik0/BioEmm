import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dosification } from '@/types'

const COLLECTION_NAME = 'dosifications'

export const dosificationsService = {
  subscribe: (onData: (data: Dosification[]) => void, onError: (error: Error) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'))
    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Dosification[]
        onData(data)
      },
      onError
    )
  },

  add: async (dosification: Omit<Dosification, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dosification)
    return docRef.id
  },

  update: async (id: string, data: Partial<Dosification>) => {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, data)
  },

  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  }
}
