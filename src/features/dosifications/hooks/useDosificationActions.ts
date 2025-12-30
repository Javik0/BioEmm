import { Dosification } from '@/types'

export function useDosificationActions(updateDosification: (id: string, data: Partial<Dosification>) => Promise<boolean | void>) {
  const markDosificationCompleted = async (dosification: Dosification) => {
    await updateDosification(dosification.id, { status: 'Completada' })
  }

  return {
    markDosificationCompleted,
  }
}
