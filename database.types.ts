
export type Categories = "Vehicles" | "Accessories" | "Parts"
 
export type MotorcycleTypes = "Offroad" | "Standard" | "Sports" | "Cruiser"
 
export interface StaffUserTable {
  id?: string | Generated<string>
  username: string | Generated<string>
  password: string | Generated<string>
  key: string | Generated<string>
}
 
export interface LogTable {
  creation_data: Date | string | Generated<Date | string>
  alert: string | Generated<string>
}
 
export interface ProductTable {
  date_added: Date | string | Generated<Date | string>
  brand: string | Generated<string>
  categories: Categories | Generated<Categories>
  name: string | Generated<string>
  price: number | Generated<number>
  description: string | Generated<string>
}
 
export interface ProductMediaTable {
  id?: string | Generated<string>
  product_id: string | Generated<string>
  url?: string
}
 
export interface MotorcycleTable {
  id?: string | Generated<string>
  product_id: string | Generated<string>
  year: number | Generated<number>
  mileage?: number
  motorcycle_type: MotorcycleTypes | Generated<MotorcycleTypes>
}
 
export interface PartTable {
  id?: string | Generated<string>
  product_id: string | Generated<string>
  part_number: string | Generated<string>
  part_type: string | Generated<string>
}
 
export interface AccessoryTable {
  id?: string | Generated<string>
  product_id: string | Generated<string>
  accessory_type: string | Generated<string>
}
