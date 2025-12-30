import { Permission } from '@/types'

export const PERMISSION_GROUPS = {
  Clientes: ['clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar'],
  Productos: ['productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar'],
  Inventario: ['inventario.ver', 'inventario.gestionar'],
  Dosificaciones: ['dosificaciones.ver', 'dosificaciones.crear', 'dosificaciones.editar'],
  Reportes: ['reportes.ver', 'reportes.exportar'],
  Usuarios: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar'],
  Roles: ['roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar'],
  Configuracion: ['configuracion.ver', 'configuracion.editar']
} as const

export const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(PERMISSION_GROUPS).flat())
)

const ROLE_PRESETS: Record<string, Permission[]> = {
  administrador: ALL_PERMISSIONS,
  vendedor: [
    'clientes.ver', 'clientes.crear', 'clientes.editar',
    'productos.ver',
    'dosificaciones.ver', 'dosificaciones.crear', 'dosificaciones.editar',
    'reportes.ver'
  ]
}

export function getPermissionsForRole(roleName?: string): Permission[] {
  if (!roleName) return []
  const key = roleName.trim().toLowerCase()
  const match = ROLE_PRESETS[key]
  if (match) return match
  // fallback: solo lectura de reportes y clientes
  return ['clientes.ver', 'reportes.ver']
}
