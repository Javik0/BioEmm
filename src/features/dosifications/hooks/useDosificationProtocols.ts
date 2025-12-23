import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DosificationProtocol } from '@/types'
import { toast } from 'sonner'

export function useDosificationProtocols() {
  const [protocols, setProtocols] = useState<DosificationProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'dosification_protocols'), orderBy('name'))

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const protocolsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DosificationProtocol[]
        
        setProtocols(protocolsData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching protocols:', err)
        setError('Error al cargar los protocolos')
        setLoading(false)
        toast.error('Error al cargar los protocolos de dosificación')
      }
    )

    return () => unsubscribe()
  }, [])

  return { protocols, loading, error }
}
