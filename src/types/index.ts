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
  notes?: string
  address?: string
  ruc?: string
  region?: string
  city?: string
  paymentTerms?: string
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp'
  photos?: ClientPhoto[]
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
  | 'unidades'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  currentStock: number
  minStock: number
  maxStock?: number
  costPerUnit?: number
  supplier?: string
  sku?: string
  createdAt: string
  lastRestockDate?: string
  notes?: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  relatedTo?: {
    type: 'dosification' | 'purchase' | 'manual'
    id?: string
    reference?: string
  }
  createdAt: string
  createdBy?: string
}

export interface DosificationProduct {
  productId: string
  productName: string
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
}
