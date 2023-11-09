import * as sqlAndTsTypes from "./sql_types.json"

namespace BioQueryParser {
  
  export type SqlAndTs = typeof sqlAndTsTypes.sql_types

  export interface Parser {
    read(): string
    clean(): string
    format(): object
  }

  export interface Column {
    name: string
    type: string
  }

  export interface Table {
    name: string
    columns: Column[]
  }


  export interface UncleanedTableDetails {
    types: { sql: string, ts: string }[]
    columns: string[]
  }
}

export default BioQueryParser
