# Postgres Schema Type Compiler

This is a simple tool that grabs a postgres schema, and attempts to generate compatible typescript types.

**NOTE** The parser was initially made with the intentions of being able to parse every type of postgresql statement/expression 
(it wasnt initally made with idea of specializing it specifically with a .sql schema). But since it seems like I wont
do that, I may refine it to fit this specific need rather than every. I will probably simplify it much more later on whenever I have time...

### Installing

```sh
  npm install psql-schema-ts-typegen
```

### Running

```sh
  npx compile -p ./path-to-your-schema.sql -m default
```

### Flags

```ts
  // the flags below are for mode selection, there is currently two modes: "default" and "kysley"
  // example: -m default
  -m 
  --mode
    
  // the flags below are for targetting your schema file.
  // example: -p ./your-schema.sql
  -p
  --path  
```

### Modes

There is two kinds of modes:

**DEFAULT**: This mode just tries to compile your schema to a valid typescript type representation. 

**KYSLEY**: This is still a work in progress, but at the momment it automatically sets the defaulted schema columns as Generated<type>.


### Examples of the tool in action

```sql

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

```

Below is the compiled typescript types:

```ts
export type authority =
	"OWNER" |
	"ADMINISTRATOR" |
	"MEMBER" |
	"CUSTOM" 

export interface user_info {
	birthday: Date;
	favorite_color: string;
	first_pet_name: string;
	pet_authority: authority;
};

export interface user {
	id: string;
	username: string;
	password_hash: string;
	description?: string;
	picture?: string;
	additional_info: user_info;
};
```

Then here is the same schema output but with kysley mode on:

```ts
import type { Generated } from "kysley";

export type authority =
	"OWNER" |
	"ADMINISTRATOR" |
	"MEMBER" |
	"CUSTOM" 

export interface user_info {
	birthday: Date;
	favorite_color: string;
	first_pet_name: string;
	pet_authority: authority;
};

export interface user {
	id: Generated<string>;
	username: Generated<string>;
	password_hash: Generated<string>;
	description?: Generated<string>;
	picture?: Generated<string>;
	additional_info: Generated<user_info>;
};
```

Pretty Cool!


### Design

This may be unecessary but I will still add it cos why not, the idea is quite simple.

1. Lexical Analysis -> Tokens for the SQL parser
2. Parser -> SQL AST
3. Transformer -> We transform the SQL AST into a TS-Compat AST
4. Compiler -> We simply walk over the TS-Compat AST and output our file.
