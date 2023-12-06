# BioQueryTypeGenerator
A simple type generator developed for https://github.com/NM711/BioQueryBuilder for postgresql and in the future, for other sql databases.

```sh
  npm install bioquery-typegenerator
```

## Type Generation
To generate your types you must provide a sql file named <b>BioQuerySchema.sql</b> which will be formatted, tokenized, and built into a <b>database.types.ts</b> file.


### Basic Tables Example

#### PSQL
```sql
 -- BioQuerySchema.sql
CREATE TABLE "user"(
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  username VARCHAR(125) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  -- expecting url to picture.
  picture TEXT DEFAULT NULL
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
);
```

#### TS
```ts
  // database.types.ts
  
  export interface UserTable {
  id: string
  username: string
  password_hash: string
  description?: string
  picture?: string
}
 
export interface PostTable {
  id: string
  author_id?: string
  title: string
  content?: string
  created_at: Date | string
  updated_at: Date | string
  attachment_url?: string
}
 
export interface PostCommentTable {
  id: string
  author_id?: string
  post_id?: string
  content?: string
  created_at: Date | string
  updated_at: Date | string
}

export interface Database {
  user: UserTable
  post: PostTable
  post_comment: PostCommentTable
}
```

### Postgresql  With Enum Type Example:

#### SQL
```sql
CREATE TYPE "authority" AS ENUM ('OWNER', 'ADMINISTRATOR', 'MEMBER', 'CUSTOM');
```

#### TS
```ts
  export type Authority = "OWNER" | "ADMINISTRATOR" | "MEMBER" | "CUSTOM"
```

As you can see, instead of it being converted into a typescript enum. It is converted into a typescript string literal type.

In the future, I plan to implement conversion for other user defined types.

## Flags

### Kysley Mode

This feature is still in development.

```sh
  npm run generate -- --mode kysley
``` 
OR
```sh
  npm run genereate  -- -m kysley
```

#### SQL
```sql
-- BioQuerySchema.sql
CREATE TABLE "user"(
  id UUID PRIMARY KEY UNIQUE DEFAULT uuid_generate_v4(),
  username VARCHAR(125) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  -- expecting url to picture.
  picture TEXT DEFAULT NULL
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
```

### TS

```ts
// database.types.ts
export interface UserTable {
  id: string | Generated<string>
  username: string | Generated<string>
  password_hash: string | Generated<string>
  description?: string | Generated<string>
  picture?: string | Generated<string>
}
 
export interface PostTable {
  id: string | Generated<string>
  author_id?: string
  title: string | Generated<string>
  content?: string | Generated<string>
  created_at: Date | string | Generated<Date | string>
  updated_at: Date | string | Generated<Date | string>
  attachment_url?: string | Generated<string>
}
```

For the time being im only making use of the <Generated> type from kysley, and im still implementing a way to provide an automatic import for the necessary types. But like I said above, this is still a work in progress.


