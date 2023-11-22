
enum CATEOGRIES {
  VEHICLES = 'Vehicles',
ACCESSORIES = 'Accessories',
PARTS = 'Parts',

} 
enum MOTORCYCLE_TYPES {
  OFFROAD = 'Offroad',
STANDARD = 'Standard',
SPORTS = 'Sports',
CRUISER = 'Cruiser',

} 
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
  categories: string
  name: number
  price: string
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
 
interface DATABASE {
  staff_user: TABLE_STAFF_USER
  log: TABLE_LOG
  product: TABLE_PRODUCT
  product_media: TABLE_PRODUCT_MEDIA
  motorcycle: TABLE_MOTORCYCLE
  part: TABLE_PART
  accessory: TABLE_ACCESSORY

}
 
 export default DATABASE