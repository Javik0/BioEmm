import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Client } from '@/types'

/**
 * Obtiene el ID de la organización actual.
 * Por defecto usa 'bioemm' si no está configurada la variable.
 * En producción multi-tenant, esto debería venir del usuario autenticado.
 */
const getOrgId = () => import.meta.env.VITE_ORG_ID || 'bioemm'

const clientsCollection = (orgId: string) =>
  collection(db, 'organizations', orgId, 'clients')

export function subscribeClients(onChange: (clients: Client[]) => void) {
  const orgId = getOrgId()
  const q = query(clientsCollection(orgId), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snap) => {
    const clients = snap.docs.map((d) => ({
      ...(d.data() as Omit<Client, 'id'>),
      id: d.id,
    }))
    onChange(clients)
  })
}

export function subscribeClientsWithError(
  onChange: (clients: Client[]) => void,
  onError: (err: unknown) => void
) {
  const orgId = getOrgId()
  const q = query(clientsCollection(orgId), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snap) => {
      const clients = snap.docs.map((d) => ({
        ...(d.data() as Omit<Client, 'id'>),
        id: d.id,
      }))
      onChange(clients)
    },
    (err) => onError(err)
  )
}

/**
 * Límite aproximado para un campo string en Firestore.
 * Firestore tiene límite de 1MiB por documento; una foto base64 de 5MB ya lo revienta.
 */
const MAX_PHOTO_URL_LENGTH = 500_000 // ~500KB en base64

/**
 * Sanitiza el cliente antes de guardarlo en Firestore:
 * - Elimina fotos base64 demasiado grandes (se deben subir a Storage)
 * - Asegura que location sea un objeto plano serializable
 */
function sanitizeClientForFirestore(client: Client): Client {
  const sanitized = { ...client }

  // Filtrar fotos con URLs base64 muy grandes
  if (sanitized.photos && sanitized.photos.length > 0) {
    const validPhotos = sanitized.photos.filter((photo) => {
      // Si es una URL normal (http/https), siempre es válida
      if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
        return true
      }
      // Si es base64, verificar tamaño
      if (photo.url.length > MAX_PHOTO_URL_LENGTH) {
        console.warn(
          `[Firestore] Foto "${photo.fileName}" omitida: base64 demasiado grande (${(photo.url.length / 1024).toFixed(0)}KB). Usa Firebase Storage.`
        )
        return false
      }
      return true
    })
    sanitized.photos = validPhotos.length > 0 ? validPhotos : undefined
  }

  // Asegurar que location sea un objeto plano (no instancia de clase)
  if (sanitized.location) {
    sanitized.location = {
      lat: sanitized.location.lat,
      lng: sanitized.location.lng,
      address: sanitized.location.address,
    }
  }

  return sanitized
}

export async function upsertClient(client: Client) {
  const orgId = getOrgId()
  const ref = doc(clientsCollection(orgId), client.id)
  const sanitized = sanitizeClientForFirestore(client)
  await setDoc(ref, sanitized, { merge: true })
}

export async function deleteClient(clientId: string) {
  const orgId = getOrgId()
  const ref = doc(clientsCollection(orgId), clientId)
  await deleteDoc(ref)
}
