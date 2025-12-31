import { useState } from 'react'
import { User, UserStatus, Role } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  MagnifyingGlass, 
  Users as UsersIcon, 
  PencilSimple, 
  Trash,
  EnvelopeSimple,
  Phone,
  ShieldCheck,
  CheckCircle,
  XCircle,
  PauseCircle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acceso completo',
    permissions: [],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Vendedor',
    description: 'Acceso a clientes y ventas',
    permissions: [],
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'javico.davila@gmail.com',
      displayName: 'Javier Dávila',
      phone: '0996560505',
      roleId: '1',
      roleName: 'Administrador',
      status: 'Activo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
  ])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'Todos'>('Todos')
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    phone: '',
    roleId: '',
    status: 'Activo' as UserStatus
  })

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'Todos' || user.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      displayName: '',
      phone: '',
      roleId: '',
      status: 'Activo'
    })
    setShowDialog(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email.trim(),
      displayName: user.displayName.toUpperCase(),
      phone: user.phone?.trim() || '',
      roleId: user.roleId,
      status: user.status
    })
    setShowDialog(true)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!userToDelete) return
    setUsers(users.filter(u => u.id !== userToDelete.id))
    toast.success('Usuario eliminado correctamente')
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedEmail = formData.email.replace(/\s+/g, '').toLowerCase()
    const normalizedName = formData.displayName.trim().toUpperCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!normalizedName) {
      toast.error('El nombre es requerido')
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Ingresa un correo válido')
      return
    }
    
    if (!formData.roleId) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    const selectedRole = MOCK_ROLES.find(r => r.id === formData.roleId)
    
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        email: normalizedEmail,
        displayName: normalizedName,
        phone: formData.phone.trim(),
        roleId: formData.roleId,
        roleName: selectedRole?.name || '',
        status: formData.status,
        updatedAt: new Date().toISOString()
      } : u))
      toast.success('Usuario actualizado correctamente')
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        email: normalizedEmail,
        displayName: normalizedName,
        phone: formData.phone.trim(),
        roleId: formData.roleId,
        roleName: selectedRole?.name || '',
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setUsers([...users, newUser])
      toast.success('Usuario creado correctamente')
    }
    
    setShowDialog(false)
  }

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'Activo':
        return <CheckCircle size={16} weight="fill" className="text-green-600" />
      case 'Inactivo':
        return <XCircle size={16} weight="fill" className="text-gray-400" />
      case 'Suspendido':
        return <PauseCircle size={16} weight="fill" className="text-red-600" />
    }
  }

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      Activo: 'default',
      Inactivo: 'secondary',
      Suspendido: 'destructive'
    }
    return (
      <Badge variant={variants[status] as any} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const statsActive = users.filter(u => u.status === 'Activo').length
  const statsInactive = users.filter(u => u.status === 'Inactivo').length
  const statsSuspended = users.filter(u => u.status === 'Suspendido').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon size={32} weight="duotone" className="text-primary" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} weight="bold" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UsersIcon size={32} weight="duotone" className="text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">{statsActive}</p>
              </div>
              <CheckCircle size={32} weight="duotone" className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold text-gray-400">{statsInactive}</p>
              </div>
              <XCircle size={32} weight="duotone" className="text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspendidos</p>
                <p className="text-2xl font-bold text-red-600">{statsSuspended}</p>
              </div>
              <PauseCircle size={32} weight="duotone" className="text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'Todos')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los estados</SelectItem>
            <SelectItem value="Activo">Activos</SelectItem>
            <SelectItem value="Inactivo">Inactivos</SelectItem>
            <SelectItem value="Suspendido">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <EnvelopeSimple size={12} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone size={14} />
                        {user.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <ShieldCheck size={12} />
                      {user.roleName}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Nunca'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
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
      <Dialog open={showDialog} onOpenChange={(open) => setShowDialog(open)}>
        <DialogContent 
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Modifica la información del usuario'
                : 'Agrega un nuevo usuario al sistema'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre Completo *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value.toUpperCase()})}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value.replace(/\s+/g, '')})}
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value.trim()})}
                placeholder="0999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={formData.roleId} onValueChange={(v) => setFormData({...formData, roleId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ROLES.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as UserStatus})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Suspendido">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado (montada siempre, fuera del Select) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash size={24} weight="fill" />
              ¿Eliminar usuario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar al usuario <strong>{userToDelete?.displayName}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
