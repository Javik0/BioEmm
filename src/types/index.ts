export type CropType = 
  | 'Aguacate'
  | 'Ajo'
  | 'Albaricoque'
  | 'Alcachofa'
  | 'Alfalfa'
  | 'Algodón'
  | 'Almendra'
  | 'Apio'
  | 'Arándano'
  | 'Arroz'
  | 'Arveja'
  | 'Avellana'
  | 'Avena'
  | 'Banano'
  | 'Berenjena'
  | 'Boniato'
  | 'Brócoli'
  | 'Cacahuete'
  | 'Cacao'
  | 'Café'
  | 'Calabacín'
  | 'Calabaza'
  | 'Caña de azúcar'
  | 'Cáñamo'
  | 'Caqui'
  | 'Cebada'
  | 'Cebolla'
  | 'Centeno'
  | 'Cereza'
  | 'Chayote'
  | 'Chile'
  | 'Cilantro'
  | 'Ciruela'
  | 'Clavel'
  | 'Col'
  | 'Coliflor'
  | 'Colza'
  | 'Dátil'
  | 'Espárrago'
  | 'Espinaca'
  | 'Forraje'
  | 'Frambuesa'
  | 'Fresa'
  | 'Girasol'
  | 'Granada'
  | 'Gypsophila'
  | 'Judía verde'
  | 'Kiwi'
  | 'Lechuga'
  | 'Leguminosas'
  | 'Lima'
  | 'Limón'
  | 'Lúpulo'
  | 'Maiz'
  | 'Mandarina'
  | 'Mango'
  | 'Manzana'
  | 'Melocotón'
  | 'Melón'
  | 'Mijo'
  | 'Mora'
  | 'Ñame'
  | 'Naranja'
  | 'Nectarina'
  | 'Nuez'
  | 'Oliva'
  | 'Paraguayo'
  | 'Patata'
  | 'Pepino'
  | 'Pera'
  | 'Pimiento'
  | 'Piña'
  | 'Pistacho'
  | 'Plátano'
  | 'Platerina'
  | 'Pomelo'
  | 'Remolacha azucarera'
  | 'Rosa'
  | 'Sandía'
  | 'Soja'
  | 'Tabaco'
  | 'Tomate de árbol'
  | 'Tomate de industria'
  | 'Trigo'
  | 'Uva de mesa'
  | 'Uva de vino'
  | 'Zanahoria'
  | 'Otro'

export const CROP_TYPES: CropType[] = [
  'Aguacate',
  'Ajo',
  'Albaricoque',
  'Alcachofa',
  'Alfalfa',
  'Algodón',
  'Almendra',
  'Apio',
  'Arándano',
  'Arroz',
  'Arveja',
  'Avellana',
  'Avena',
  'Banano',
  'Berenjena',
  'Boniato',
  'Brócoli',
  'Cacahuete',
  'Cacao',
  'Café',
  'Calabacín',
  'Calabaza',
  'Caña de azúcar',
  'Cáñamo',
  'Caqui',
  'Cebada',
  'Cebolla',
  'Centeno',
  'Cereza',
  'Chayote',
  'Chile',
  'Cilantro',
  'Ciruela',
  'Clavel',
  'Col',
  'Coliflor',
  'Colza',
  'Dátil',
  'Espárrago',
  'Espinaca',
  'Forraje',
  'Frambuesa',
  'Fresa',
  'Girasol',
  'Granada',
  'Gypsophila',
  'Judía verde',
  'Kiwi',
  'Lechuga',
  'Leguminosas',
  'Lima',
  'Limón',
  'Lúpulo',
  'Maiz',
  'Mandarina',
  'Mango',
  'Manzana',
  'Melocotón',
  'Melón',
  'Mijo',
  'Mora',
  'Ñame',
  'Naranja',
  'Nectarina',
  'Nuez',
  'Oliva',
  'Paraguayo',
  'Patata',
  'Pepino',
  'Pera',
  'Pimiento',
  'Piña',
  'Pistacho',
  'Plátano',
  'Platerina',
  'Pomelo',
  'Remolacha azucarera',
  'Rosa',
  'Sandía',
  'Soja',
  'Tabaco',
  'Tomate de árbol',
  'Tomate de industria',
  'Trigo',
  'Uva de mesa',
  'Uva de vino',
  'Zanahoria',
  'Otro'
]

export type ClientStatus = 'Prospecto' | 'Activo' | 'Inactivo'

export type AgricultureType = 'Ecológica' | 'Tradicional'
export const AGRICULTURE_TYPES: AgricultureType[] = ['Ecológica', 'Tradicional']

export type ApplicationMode = 'Foliar' | 'Radicular' | 'Ambos'
export const APPLICATION_MODES: ApplicationMode[] = ['Foliar', 'Radicular', 'Ambos']

export interface ClientPhoto {
  id: string
  url: string
  fileName: string
  description?: string
  uploadedAt: string
}

export interface Client {
  id: string
  name: string
  contact: string
  phone: string
  email?: string
  cropType: CropType
  hectares: number
  location?: {
    lat: number
    lng: number
    address?: string
  }
  status: ClientStatus
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  notes?: string
  address?: string
  ruc?: string
  region?: string
  city?: string
  paymentTerms?: string
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp'
  photos?: ClientPhoto[]
  agricultureType?: AgricultureType
  applicationMode?: ApplicationMode
  cropCategory?: CropCategory
}

export type ProductCategory = 
  | 'Fertilizante' 
  | 'Insecticida' 
  | 'Fungicida' 
  | 'Herbicida'
  | 'Bioestimulante'
  | 'Otro'

export type ProductUnit = 
  | 'L' 
  | 'kg' 
  | 'g'
  | 'ml'
  | 'cc'
  | 'unidades'

export interface ProductPresentation {
  id: string
  label: string // Ej: "20L", "500cc"
  unit: ProductUnit
  pvp: number
  discounts?: {
    d10?: number
    d15?: number
    d20?: number
    d25?: number
    d35?: number
  }
  stock: {
    current: number
    min: number
    max?: number
  }
  sku?: string
  notes?: string
}

export interface Product {
  id: string
  name: string
  code?: string
  category: ProductCategory
  unit: ProductUnit // Unidad principal del producto base
  currentStock: number
  minStock: number
  maxStock?: number
  costPerUnit?: number
  supplier?: string
  sku?: string
  presentations?: ProductPresentation[] // Stock y precio por presentación
  createdAt: string
  createdBy?: string
  lastRestockDate?: string
  updatedAt?: string
  updatedBy?: string
  notes?: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  presentationId?: string
  presentationLabel?: string
  type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  clientId?: string
  clientName?: string
  relatedTo?: {
    type: 'dosification' | 'purchase' | 'manual' | 'order'
    id?: string
    reference?: string
  }
  createdAt: string
  createdBy?: string
}

export type OrderStatus = 'draft' | 'confirmed' | 'delivered' | 'canceled' | 'returned'

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue'

export interface OrderItem {
  productId: string
  productName: string
  presentationId?: string
  presentationLabel?: string
  unit: string
  quantity: number
  unitPrice?: number
  lineTotal?: number
  stockMovementId?: string
}

export interface Order {
  id: string
  clientId: string
  clientName: string
  status: OrderStatus
  paymentStatus?: PaymentStatus
  orderDate: string
  dueDate?: string
  total?: number
  currency?: string
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt?: string
  items: OrderItem[]
}

export interface DosificationProduct {
  productId: string
  productName: string
  presentationId?: string
  presentationLabel?: string
  quantity: number
  unit: string
}

export interface Dosification {
  id: string
  clientId: string
  clientName: string
  date: string
  hectares: number
  cropType: CropType
  products: DosificationProduct[]
  notes?: string
  status: 'Pendiente' | 'Aplicada' | 'Completada'
  nextApplicationDate?: string
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export type CropCategory = 
  | 'Brasicas'
  | 'Cítricos'
  | 'Cucurbitaceas'
  | 'Flores ornamentales'
  | 'Forrajeras'
  | 'Fruta de cáscara'
  | 'Fruta de hueso'
  | 'Fruta de pepita'
  | 'Frutos rojos'
  | 'Grano'
  | 'Hortícola'
  | 'Leguminosas'
  | 'Oleaginosas'
  | 'Textil'
  | 'Tropical'
  | 'Tubérculos y raíces'
  | 'Viña'

export const CROP_CATEGORIES: CropCategory[] = [
  'Brasicas',
  'Cítricos',
  'Cucurbitaceas',
  'Flores ornamentales',
  'Forrajeras',
  'Fruta de cáscara',
  'Fruta de hueso',
  'Fruta de pepita',
  'Frutos rojos',
  'Grano',
  'Hortícola',
  'Leguminosas',
  'Oleaginosas',
  'Textil',
  'Tropical',
  'Tubérculos y raíces',
  'Viña'
]

export type AgricultureObjective = 
  | 'Activación inmunidad innata y autodefensa'
  | 'Bioprotección'
  | 'Calibre color y azúcares'
  | 'Correctores'
  | 'Correctores de ph y calidad del agua'
  | 'Dureza conservación y calidad post cosecha'
  | 'Enraizante'
  | 'Estrés abiótico'
  | 'Floración y cuajado'
  | 'Incremento de peso específico de proteína'
  | 'Materias orgánicas y mejorantes de suelo'
  | 'Vigor y desarrollo vegetativo'

export const AGRICULTURE_OBJECTIVES: AgricultureObjective[] = [
  'Activación inmunidad innata y autodefensa',
  'Bioprotección',
  'Calibre color y azúcares',
  'Correctores',
  'Correctores de ph y calidad del agua',
  'Dureza conservación y calidad post cosecha',
  'Enraizante',
  'Estrés abiótico',
  'Floración y cuajado',
  'Incremento de peso específico de proteína',
  'Materias orgánicas y mejorantes de suelo',
  'Vigor y desarrollo vegetativo'
]

// Visitas programadas
export type VisitStatus = 'Programada' | 'Completada' | 'Cancelada' | 'Reprogramada'

export const VISIT_STATUSES: VisitStatus[] = ['Programada', 'Completada', 'Cancelada', 'Reprogramada']

export type VisitType = 'Prospección' | 'Seguimiento' | 'Aplicación' | 'Cobranza' | 'Entrega' | 'Otro'

export const VISIT_TYPES: VisitType[] = ['Prospección', 'Seguimiento', 'Aplicación', 'Cobranza', 'Entrega', 'Otro']

export interface Visit {
  id: string
  clientId: string
  clientName: string
  scheduledDate: string // ISO date
  scheduledTime?: string // HH:mm
  type: VisitType
  status: VisitStatus
  assignedTo?: string
  notes?: string
  completedAt?: string
  completionNotes?: string
  createdAt: string
  reminderDaysBefore?: number
}

// Roles y Permisos
export type Permission = 
  | 'clientes.ver'
  | 'clientes.crear'
  | 'clientes.editar'
  | 'clientes.eliminar'
  | 'productos.ver'
  | 'productos.crear'
  | 'productos.editar'
  | 'productos.eliminar'
  | 'inventario.ver'
  | 'inventario.gestionar'
  | 'dosificaciones.ver'
  | 'dosificaciones.crear'
  | 'dosificaciones.editar'
  | 'reportes.ver'
  | 'reportes.exportar'
  | 'usuarios.ver'
  | 'usuarios.crear'
  | 'usuarios.editar'
  | 'usuarios.eliminar'
  | 'roles.ver'
  | 'roles.crear'
  | 'roles.editar'
  | 'roles.eliminar'
  | 'configuracion.ver'
  | 'configuracion.editar'

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean // Roles del sistema no se pueden eliminar
  createdAt: string
  updatedAt: string
}

export type UserStatus = 'Activo' | 'Inactivo' | 'Suspendido'

export interface User {
  id: string
  email: string
  displayName: string
  phone?: string
  roleId: string
  roleName: string
  status: UserStatus
  avatar?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface ProtocolProduct {
  code: string
  name: string
  quantity: number
  unit: string
  price: number
}

export interface ProtocolStage {
  name: string
  products: ProtocolProduct[]
}

export interface DosificationProtocol {
  id?: string
  name: string
  type: string
  stages: ProtocolStage[]
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}
