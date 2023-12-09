CREATE EXTENSION "uuid-ossp";

CREATE TABLE "user"(
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  username VARCHAR(125) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  -- expecting url to picture.
  picture TEXT DEFAULT NULL
);

CREATE TYPE "person_type" AS (first_name VARCHAR(50),
                last_name VARCHAR(50),age INT,
    auth "authority"
);


CREATE TABLE "post" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES "user"(id),
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  attachment_url VARCHAR(255) DEFAULT NULL
);

CREATE TABLE "post_comment" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  post_id UUID REFERENCES "post"(id) ON DELETE CASCADE,
  content TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
  randomObj "person_type" UNIQUE
);

CREATE TABLE "post_upvote" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES "user"(id),
  post_id UUID REFERENCES "post"(id) ON DELETE CASCADE
);

CREATE TABLE "post_downvote" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES "user"(id),
  post_id UUID REFERENCES "post"(id) ON DELETE CASCADE
);

CREATE TABLE "community" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  member_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CUSTOM authority holds no real value, its just so that admins and owners can create cool roles
-- that say cool stuff.

CREATE TYPE "authority" AS ENUM (
  'OWNER',
  'ADMINISTRATOR',
  'MEMBER',
  'CUSTOM'
);

CREATE TABLE "community_role" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES "community"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'COMMUNITY_ROLE',
  role_authority "authority" NOT NULL
);

-- Add a unique constraint for 'OWNER', 'ADMINISTRATOR', and 'MEMBER'
ALTER TABLE "community_role"
ADD CONSTRAINT unique_authority_constraint
CHECK (
  (role_authority = 'OWNER' OR role_authority = 'ADMINISTRATOR' OR role_authority = 'MEMBER')
  OR
  (role_authority = 'CUSTOM')
);

CREATE TABLE "community_member" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  community_id UUID REFERENCES "community"(id) ON DELETE CASCADE,
  community_role_id UUID REFERENCES "community_role"(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "community_post" (
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES "community"(id) ON DELETE CASCADE,
  -- A post can only belong to a single community unless it is a personal post.
  post_id UUID UNIQUE REFERENCES "post"(id) ON DELETE CASCADE,
  community_member_id UUID REFERENCES "community_member" ON DELETE CASCADE
);
