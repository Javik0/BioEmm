import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Visit } from '@/types'

const getOrgId = () => import.meta.env.VITE_ORG_ID || 'bioemm'

const visitsCollection = (orgId: string) =>
  collection(db, 'organizations', orgId, 'visits')

export const visitsService = {
  subscribe(
    onChange: (visits: Visit[]) => void,
    onError: (err: unknown) => void
  ) {
    const orgId = getOrgId()
    const q = query(visitsCollection(orgId), orderBy('scheduledDate', 'desc'))

    return onSnapshot(
      q,
      (snap) => {
        const visits = snap.docs.map((d) => ({
          ...(d.data() as Omit<Visit, 'id'>),
          id: d.id,
        }))
        onChange(visits)
      },
      onError
    )
  },

  subscribeByClient(
    clientId: string,
    onChange: (visits: Visit[]) => void,
    onError: (err: unknown) => void
  ) {
    const orgId = getOrgId()
    const q = query(
      visitsCollection(orgId),
      where('clientId', '==', clientId),
      orderBy('scheduledDate', 'desc')
    )

    return onSnapshot(
      q,
      (snap) => {
        const visits = snap.docs.map((d) => ({
          ...(d.data() as Omit<Visit, 'id'>),
          id: d.id,
        }))
        onChange(visits)
      },
      onError
    )
  },

  async add(visit: Omit<Visit, 'id'>) {
    const orgId = getOrgId()
    const newDocRef = doc(visitsCollection(orgId))
    await setDoc(newDocRef, {
      ...visit,
      createdAt: new Date().toISOString()
    })
    return newDocRef.id
  },

  async update(visit: Visit) {
    const orgId = getOrgId()
    const docRef = doc(visitsCollection(orgId), visit.id)
    await setDoc(docRef, visit, { merge: true })
  },

  async delete(id: string) {
    const orgId = getOrgId()
    const docRef = doc(visitsCollection(orgId), id)
    await deleteDoc(docRef)
  }
}
