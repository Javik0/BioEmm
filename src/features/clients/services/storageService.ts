import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/**
 * Sube una foto a Firebase Storage y retorna la URL
 * @param file - Archivo de imagen o dataURL (base64)
 * @param clientId - ID del cliente para organizar las fotos
 * @param photoId - ID único de la foto
 */
export async function uploadClientPhoto(
  file: File | string,
  clientId: string,
  photoId: string
): Promise<string> {
  const path = `clients/${clientId}/photos/${photoId}`
  const storageRef = ref(storage, path)

  let blob: Blob

  if (typeof file === 'string') {
    // Es un dataURL (base64), convertir a Blob
    const response = await fetch(file)
    blob = await response.blob()
  } else {
    blob = file
  }

  await uploadBytes(storageRef, blob)
  const downloadURL = await getDownloadURL(storageRef)
  
  return downloadURL
}

/**
 * Elimina una foto de Firebase Storage
 * @param url - URL de la foto a eliminar
 */
export async function deleteClientPhoto(url: string): Promise<void> {
  try {
    // Extraer el path desde la URL
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    // Si la foto no existe en storage (era base64), ignorar
    console.warn('No se pudo eliminar la foto de Storage:', error)
  }
}

/**
 * Verifica si una URL es de Firebase Storage
 */
export function isStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com')
}

/**
 * Verifica si una URL es base64 (data URL)
 */
export function isBase64Url(url: string): boolean {
  return url.startsWith('data:')
}
