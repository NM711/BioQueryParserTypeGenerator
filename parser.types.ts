import * as sqlAndTsTypes from "./sql_types.json"

namespace BioQueryParser {
  
  export type SqlAndTs = typeof sqlAndTsTypes.sql_types
  
  export type SqlAndTsKeys = keyof SqlAndTs

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
