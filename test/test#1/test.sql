CREATE TYPE "authority" AS ENUM ('OWNER', 'ADMINISTRATOR', 'MEMBER', 'CUSTOM');

CREATE TYPE "user_info" AS (
  birthday TIMESTAMP,
  favorite_color VARCHAR(255),
  first_pet_name VARCHAR(255),
  pet_authority "authority"
);

CREATE TABLE "user"(
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  username VARCHAR(125) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  -- expecting url to picture.
  picture TEXT DEFAULT NULL,
  additional_info "user_info" NOT NULL
);

