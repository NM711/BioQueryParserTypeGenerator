namespace LexerTypes {

  export enum TSTypes {
    NUMBER = "number",
    STRING = "string",
    DATE = "Date"
  }

  export const sqlTypes = {
    "VARCHAR": TSTypes.STRING,
    "TEXT": TSTypes.STRING,
    "UUID": TSTypes.STRING,
    "INTEGER": TSTypes.NUMBER,
    "INT": TSTypes.NUMBER,
    "BIGINT": TSTypes.NUMBER,
    "SMALLINT": TSTypes.NUMBER,
    "SERIAL": TSTypes.NUMBER,
    "TIMESTAMP": `${TSTypes.DATE} | ${TSTypes.STRING}`
  }

  export enum Keywords {
    "NOT NULL" = "NOT NULL",
    "DEFAULT" = "DEFAULT",
    "UNIQUE" = "UNIQUE"
  }

  export enum TokenType {
    CUSTOM_TYPE = "CUSTOM_TYPE",
    ENUM = "ENUM",
    RANGE = "RANGE",
    TABLE = "TABLE",
    COLUMN = "COLUMN",
  }

  export type KeywordKey = keyof typeof Keywords
  
  export interface ColumnDataToken {
    token_id: TokenType.COLUMN
    type: keyof typeof sqlTypes | string,
    name: string,
    constraints: Set<KeywordKey>
  }

  export interface TableDataToken {
    token_id: TokenType.TABLE
    name: string,
    columns: ColumnDataToken[]
  }

  export interface TypeEnumToken {
    token_id: TokenType.ENUM 
    name: string
    value: string[] | number[]
  }

  export interface CustomTokenTypeField {
    name: string
    type: keyof typeof sqlTypes | string
  }

  export interface TypeCustomToken {
    token_id: TokenType.CUSTOM_TYPE | TokenType.RANGE
    name: string
    value: CustomTokenTypeField[]
  }

  export type Token = TableDataToken | ColumnDataToken | TypeCustomToken | TypeEnumToken

  export interface Regex {
    table: RegExp,
    custom_type: RegExp,
    field: RegExp,
    comment: RegExp
  }

}

export default LexerTypes
