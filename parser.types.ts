import * as sqlAndTsTypes from "./sql_types.json"

namespace BioQueryParser {

  export type SqlAndTs = typeof sqlAndTsTypes.sql_types
  
  export type SqlAndTsKeys = keyof SqlAndTs

  export type SqlCustomTypeKeywords<Custom> = "ENUM" | "RANGE" | Custom

  export interface SqlColumn {
    name: string
    type: string
  }

  export interface SqlTable {
    name: string
    columns: SqlColumn[]
  }

  export interface SqlCustomType<Custom = void> {
    name: string
    type: SqlCustomTypeKeywords<Custom>
  }

  export interface SqlEnum<Custom = any> extends SqlCustomType<Custom>{
    fields: string[]
  }
  // here we can chain a variaty of types such as RANGE, ENUMS, CUSTOMS, etc
  export type SqlTypesCustomAndBuilt = SqlEnum

  export interface UncleanedTableDetails {
    types: { sql: string, ts: string }[]
    columns: string[]
  }

  
  export type CustomTypes = BioQueryParser.SqlEnum[] & BioQueryParser.SqlCustomType[]
  export type CustomType = BioQueryParser.SqlEnum<string> & BioQueryParser.SqlCustomType
}

export default BioQueryParser
