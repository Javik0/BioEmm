import { useState } from 'react'
import { Role, Permission } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  MagnifyingGlass, 
  ShieldCheck, 
  PencilSimple, 
  Trash,
  Lock,
  Users as UsersIcon
} from '@phosphor-icons/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const PERMISSION_GROUPS = {
  'Clientes': ['clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar'],
  'Productos': ['productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar'],
  'Inventario': ['inventario.ver', 'inventario.gestionar'],
  'Dosificaciones': ['dosificaciones.ver', 'dosificaciones.crear', 'dosificaciones.editar'],
  'Reportes': ['reportes.ver', 'reportes.exportar'],
  'Usuarios': ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar'],
  'Roles': ['roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar'],
  'Configuración': ['configuracion.ver', 'configuracion.editar']
} as const

const PERMISSION_LABELS: Record<Permission, string> = {
  'clientes.ver': 'Ver clientes',
  'clientes.crear': 'Crear clientes',
  'clientes.editar': 'Editar clientes',
  'clientes.eliminar': 'Eliminar clientes',
  'productos.ver': 'Ver productos',
  'productos.crear': 'Crear productos',
  'productos.editar': 'Editar productos',
  'productos.eliminar': 'Eliminar productos',
  'inventario.ver': 'Ver inventario',
  'inventario.gestionar': 'Gestionar inventario',
  'dosificaciones.ver': 'Ver dosificaciones',
  'dosificaciones.crear': 'Crear dosificaciones',
  'dosificaciones.editar': 'Editar dosificaciones',
  'reportes.ver': 'Ver reportes',
  'reportes.exportar': 'Exportar reportes',
  'usuarios.ver': 'Ver usuarios',
  'usuarios.crear': 'Crear usuarios',
  'usuarios.editar': 'Editar usuarios',
  'usuarios.eliminar': 'Eliminar usuarios',
  'roles.ver': 'Ver roles',
  'roles.crear': 'Crear roles',
  'roles.editar': 'Editar roles',
  'roles.eliminar': 'Eliminar roles',
  'configuracion.ver': 'Ver configuración',
  'configuracion.editar': 'Editar configuración'
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Administrador',
      description: 'Acceso completo a todas las funcionalidades del sistema',
      permissions: Object.values(PERMISSION_GROUPS).flat() as Permission[],
      isSystem: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Vendedor',
      description: 'Acceso a clientes, dosificaciones y productos',
      permissions: [
        'clientes.ver', 'clientes.crear', 'clientes.editar',
        'productos.ver',
        'dosificaciones.ver', 'dosificaciones.crear', 'dosificaciones.editar',
        'reportes.ver'
      ] as Permission[],
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  })

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({ name: '', description: '', permissions: [] })
    setShowDialog(true)
  }

  const handleEdit = (role: Role) => {
    if (role.isSystem) {
      toast.error('No se pueden editar roles del sistema')
      return
    }
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    })
    setShowDialog(true)
  }

  const handleDelete = (role: Role) => {
    if (role.isSystem) {
      toast.error('No se pueden eliminar roles del sistema')
      return
    }
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!roleToDelete) return
    setRoles(roles.filter(r => r.id !== roleToDelete.id))
    toast.success('Rol eliminado correctamente')
    setDeleteDialogOpen(false)
    setRoleToDelete(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    
    if (formData.permissions.length === 0) {
      toast.error('Debe seleccionar al menos un permiso')
      return
    }

    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? {
        ...r,
        ...formData,
        updatedAt: new Date().toISOString()
      } : r))
      toast.success('Rol actualizado correctamente')
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setRoles([...roles, newRole])
      toast.success('Rol creado correctamente')
    }
    
    setShowDialog(false)
  }

  const togglePermission = (permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const toggleGroupPermissions = (groupPermissions: readonly Permission[]) => {
    const allSelected = groupPermissions.every(p => formData.permissions.includes(p))
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !groupPermissions.includes(p))
        : [...new Set([...prev.permissions, ...groupPermissions])]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={32} weight="duotone" className="text-primary" />
            Gestión de Roles
          </h2>
          <p className="text-muted-foreground mt-1">
            Define roles y permisos para los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} weight="bold" />
          Nuevo Rol
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Buscar roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla de Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>
            {filteredRoles.length} {filteredRoles.length === 1 ? 'rol' : 'roles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.permissions.length} permisos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge className="gap-1">
                        <Lock size={12} weight="fill" />
                        Sistema
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Personalizado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(role)}
                        disabled={role.isSystem}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role)}
                        disabled={role.isSystem}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Modifica los permisos y configuración del rol'
                : 'Define los permisos para el nuevo rol'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Rol *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Supervisor de ventas"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe las responsabilidades de este rol..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisos *</Label>
              <div className="border rounded-lg p-4 space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={permissions.every(p => formData.permissions.includes(p as Permission))}
                        onCheckedChange={() => toggleGroupPermissions(permissions as readonly Permission[])}
                      />
                      <Label 
                        htmlFor={`group-${group}`}
                        className="font-semibold cursor-pointer"
                      >
                        {group}
                      </Label>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {permissions.map(permission => (
                        <div key={permission} className="flex items-center gap-2">
                          <Checkbox
                            id={permission}
                            checked={formData.permissions.includes(permission as Permission)}
                            onCheckedChange={() => togglePermission(permission as Permission)}
                          />
                          <Label
                            htmlFor={permission}
                            className="text-sm cursor-pointer"
                          >
                            {PERMISSION_LABELS[permission as Permission]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash size={24} weight="fill" />
              ¿Eliminar rol?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el rol <strong>{roleToDelete?.name}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
