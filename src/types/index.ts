export type CropType = 
  | 'Flores' 
  | 'Hortalizas' 
  | 'Frutas' 
  | 'Granos' 
  | 'Tubérculos'
  | 'Otro'

export type ClientStatus = 'Prospecto' | 'Activo' | 'Inactivo'

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
}

export interface Product {
  id: string
  name: string
  type: string
  unit: string
  stock: number
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
