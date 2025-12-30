import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
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
}
