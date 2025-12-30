import { Visit } from '@/types'

export function useVisitActions(updateVisit: (visit: Visit) => Promise<boolean | void>) {
  const markVisitCompleted = async (visit: Visit) => {
    await updateVisit({ ...visit, status: 'Completada', completedAt: new Date().toISOString() })
  }

  return {
    markVisitCompleted,
  }
}
