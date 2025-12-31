import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { adminAuth } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import type { User } from '@/types'

const getOrgId = () => import.meta.env.VITE_ORG_ID || 'bioemm'

const usersCollection = (orgId: string) => collection(db, 'organizations', orgId, 'users')

export const usersService = {
  subscribe(onChange: (users: User[]) => void, onError: (err: unknown) => void) {
    const orgId = getOrgId()
    const q = query(usersCollection(orgId), orderBy('displayName'))

    return onSnapshot(
      q,
      (snap) => {
        const users = snap.docs.map((d) => ({
          ...(d.data() as Omit<User, 'id'>),
          id: d.id
        }))
        onChange(users)
      },
      onError
    )
  }
,
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>) {
    const orgId = getOrgId()
    const now = new Date().toISOString()

    // Create auth user in secondary app so current session is not affected
    const tempPassword = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(-12)
    const cred = await createUserWithEmailAndPassword(adminAuth, user.email, tempPassword)

    // Send reset so the new user sets their own password
    await sendPasswordResetEmail(adminAuth, user.email)

    await setDoc(doc(usersCollection(orgId), cred.user.uid), {
      ...user,
      createdAt: now,
      updatedAt: now,
    })

    return cred.user.uid
  },

  async update(id: string, updates: Partial<Omit<User, 'id'>>) {
    const orgId = getOrgId()
    await updateDoc(doc(usersCollection(orgId), id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  },

  async delete(id: string) {
    const orgId = getOrgId()
    await deleteDoc(doc(usersCollection(orgId), id))
    // Note: Auth account remains; needs admin backend to fully disable/delete.
  }
}
