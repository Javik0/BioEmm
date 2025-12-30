import { useEffect, useMemo, useState } from 'react'
import { useFirebaseAuth } from './useFirebaseAuth'
import { usersService } from '@/features/users'
import { getPermissionsForRole, ALL_PERMISSIONS } from '@/lib/permissions'
import type { Permission, User } from '@/types'

interface PermissionState {
  permissions: Permission[]
  roleName?: string
  loading: boolean
}

export function useUserPermissions(): PermissionState {
  const { user, loading: authLoading } = useFirebaseAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    const unsubscribe = usersService.subscribe(
      (data) => {
        setUsers(data)
        setLoadingUsers(false)
      },
      () => setLoadingUsers(false)
    )
    return () => unsubscribe()
  }, [])

  const { permissions, roleName } = useMemo(() => {
    if (!user) return { permissions: [] as Permission[], roleName: undefined }
    const profile = users.find((u) => u.email.toLowerCase() === user.email?.toLowerCase())
    const role = profile?.roleName

    // Si no hay perfil, asumir admin para no bloquear al usuario autenticado.
    if (!profile) {
      return {
        permissions: ALL_PERMISSIONS,
        roleName: 'Administrador'
      }
    }

    return {
      permissions: getPermissionsForRole(role),
      roleName: role
    }
  }, [user, users])

  return {
    permissions,
    roleName,
    loading: authLoading || loadingUsers
  }
}
