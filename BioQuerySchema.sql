CREATE TABLE staff_user (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4 (),
  username VARCHAR (255) UNIQUE,
  password VARCHAR (255) NOT NULL,
  key VARCHAR (255) NOT NULL
);

CREATE TABLE log (
  creation_data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  alert TEXT NOT NULL
);

CREATE TYPE Cateogries AS ENUM ('Vehicles', 'Accessories', 'Parts');
CREATE TYPE motorcycle_types AS ENUM ('Offroad', 'Standard', 'Sports', 'Cruiser');

CREATE TABLE product (
  -- hello world
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  brand VARCHAR(75) NOT NULL,
  categories Categories NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  description TEXT DEFAULT 'There is no description for this product!' NOT NULL
);

CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  url VARCHAR(255)
);

CREATE TABLE motorcycle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  mileage INTEGER,
  motorcycle_type motorcycle_types NOT NULL
);

CREATE TABLE part (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  part_number VARCHAR(255) NOT NULL,
  part_type VARCHAR(255) NOT NULL
);

CREATE TABLE accessory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  accessory_type VARCHAR(255) NOT NULL
);
