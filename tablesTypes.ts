import type BioQueryParser from "./parser.types"

/**
 * @class SQLTableParser
 * @description
 * Class that parses tables in a SQL schema, searches its type, and associates it with a typescript type.
 * After this is complete, a token representing the table is generated to be written as a typescript interface.
 * */

class SQLTableParser {
  public sqlTypes: BioQueryParser.SqlAndTs

  constructor (sqlTypes: BioQueryParser.SqlAndTs) {
    this.sqlTypes = sqlTypes
  }

  private parseTables(unformatted: string[]): BioQueryParser.SqlTable[] | null {
    try {
      const tables: BioQueryParser.SqlTable[] = []
      for (const t of unformatted) {
        // LOOK FOR CREATETABLE(.*?) -> GETS ANY IN BETWEEN THAT AND \(\g -> searches globally
        const createdTablesSplit = t.split(/CREATETABLE(.*?)\(/g)
        const name = createdTablesSplit[1]

        if (!name) continue
        const uncleanedColumns = createdTablesSplit[2].replace(/[\d()]/g, "").split(",").map(a => a.replace(/([a-z])([A-Z])/g, '\$1 \$2'))
        const uncleanedTableDetails: BioQueryParser.UncleanedTableDetails = {
          types: [],
          columns: []
        }

        for (const x of uncleanedColumns) {
          const column = x.split(" ")[0]
          if (!column) continue

          uncleanedTableDetails.columns.push(column)

          for (const key in this.sqlTypes) {
            const isMatch = x.match(key)?.[0]
            if (!isMatch) continue
            const sqlType = key as BioQueryParser.SqlAndTsKeys
            const tsTypeValue = this.sqlTypes[sqlType]
            uncleanedTableDetails.types.push({ sql: sqlType, ts: tsTypeValue })
          }
        }

        const columns: BioQueryParser.SqlColumn[] = []

        for (let i = 0; i < uncleanedTableDetails.columns.length; i++) {
          const columnName = uncleanedTableDetails.columns[i]
          const columnType = uncleanedTableDetails.types[i]
          if (columnName && columnType && columnType.ts) {
              columns.push({ name: columnName, type: columnType.ts })
          }
        }

        tables.push({
          name,
          columns
        })
      }
      return tables
    } catch (e) {
      console.error(e)
      return null
    }
  }

  
  private createInterfaceString (name: string, types: string) {
    return `\ninterface ${name} {\n${types}\n}\n`
  }

  public tablesToInterfacesTS (unformatted: string[]): string[] {
    const interfacesToWrite: string[] = []

    let databaseTablesInterfaces: string = ""
    const tables = this.parseTables(unformatted)

    if (!tables) throw new Error("Failed to parse tables!")

    for (const table of tables) {
      const stringifiedColumns: string[] = []
      for (const column of table.columns) {
        stringifiedColumns.push(`  ${column.name}: ${column.type}`)
      }

      const tableInterfaceName = `TABLE_${table.name.replace(/["']/g, "").toUpperCase()}`
      const tableInterface = this.createInterfaceString(tableInterfaceName, stringifiedColumns.join("\n"))
      interfacesToWrite.push(tableInterface)
      databaseTablesInterfaces += `  ${table.name.replace(/["']/g, "")}: ${tableInterfaceName}\n`
    }

    const databaseInterface = this.createInterfaceString("DATABASE", databaseTablesInterfaces)

    interfacesToWrite.push(`${databaseInterface} \n export default DATABASE`)
    return interfacesToWrite
  }
}

export default SQLTableParser
