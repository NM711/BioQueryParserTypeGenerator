
export type Categories = "Vehicles" | "Accessories" | "Parts"
 
export type MotorcycleTypes = "Offroad" | "Standard" | "Sports" | "Cruiser"
 
export interface StaffUserTable {
  id?: string
  username: string
  password: string
  key: string
}
 
export interface LogTable {
  creation_data: Date | string
  alert: string
}
 
export interface ProductTable {
  id?: string
  date_added: Date | string
  brand: string
  categories: Categories
  name: string
  price: number
  description: string
}
 
export interface ProductMediaTable {
  id?: string
  product_id: string
  url?: string
}
 
export interface MotorcycleTable {
  id?: string
  product_id: string
  year: number
  mileage?: number
  motorcycle_type: MotorcycleTypes
}
 
export interface PartTable {
  id?: string
  product_id: string
  part_number: string
  part_type: string
}
 
export interface AccessoryTable {
  id?: string
  product_id: string
  accessory_type: string
}
