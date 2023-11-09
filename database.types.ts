

interface TABLE_STAFF_USER {
  id: string
  username: string
  password: string
  key: string
}
 
interface TABLE_LOG {
  creation_data: string | Date
  alert: string
}
 
interface TABLE_PRODUCT {
  id: string
  date_added: string | Date
  brand: string
  name: string
  price: number
  description: string
}
 
interface TABLE_PRODUCT_MEDIA {
  id: string
  product_id: string
  url: string
}
 
interface TABLE_MOTORCYCLE {
  id: string
  product_id: string
  year: number
  mileage: number
}
 
interface TABLE_PART {
  id: string
  product_id: string
  part_number: string
  part_type: string
}
 
interface TABLE_ACCESSORY {
  id: string
  product_id: string
  accessory_type: string
}

