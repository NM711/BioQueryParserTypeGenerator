import * as sqlAndTsTypes from "./sql_types.json"
import fs from "node:fs"
import type BioQueryParser from "./parser.types"

class BioQuerySQLParser {
  private sqlTypes: BioQueryParser.SqlAndTs
  constructor () {
    this.sqlTypes = sqlAndTsTypes.sql_types
  }

  private read(): string {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  private clean(): BioQueryParser.Table[] | null {
    console.time("Performance")
    try {
      const tables: BioQueryParser.Table[] = []
      const unformatted = this.read()

      const uncleanedTables = unformatted.replace(/[\n\s]/g, "").split(";")

      for (const t of uncleanedTables) {
        // LOOK FOR CREATETABLE(.*?) -> GETS ANY IN BETWEEN THAT AND \(\g -> searches globally
        const split = t.split(/CREATETABLE(.*?)\(/g)
        const name = split[1]

        if (!name) continue

        const uncleanedColumns = split[2].replace(/[\d()]/g, "").split(",").map(a => a.replace(/([a-z])([A-Z])/g, '\$1 \$2'))

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

            if (isMatch) {
              const sqlType = key as BioQueryParser.SqlAndTsKeys
              const tsTypeValue = this.sqlTypes[sqlType]
              uncleanedTableDetails.types.push({ sql: sqlType, ts: tsTypeValue })
            }
          }
        }

        const columns: BioQueryParser.Column[] = []

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
        console.timeEnd("Performance")
        return tables
      } catch (e) {
        console.error(e)

        return null
    }
  }

  private createInterfaceString (name: string, types: string) {
    return `\ninterface ${name} {\n${types}\n}\n`
  }

  private tablesToInterfaces (): string[] {
    const interfacesToWrite: string[] = []
    
    let databaseTablesInterfaces: string = ""
    const tables = this.clean()

    if (!tables) throw new Error("Cannot write to file because the tables dont exist")
    
    for (const table of tables) {
      const stringifiedColumns: string[] = []
      for (const column of table.columns) {
        stringifiedColumns.push(`  ${column.name}: ${column.type}`)
      }

      const tableInterfaceName = `TABLE_${table.name.toUpperCase()}`
      const tableInterface = this.createInterfaceString(tableInterfaceName, stringifiedColumns.join("\n"))
      interfacesToWrite.push(tableInterface)
      databaseTablesInterfaces += `  ${table.name}: ${tableInterfaceName}\n`
    }

    // create database interface and export default it
    const databaseInterface = this.createInterfaceString("DATABASE", databaseTablesInterfaces)

    interfacesToWrite.push(`${databaseInterface} \n export default DATABASE`)
    return interfacesToWrite
  }

  // NOTE: Still need to work on SQL enum support, essentially I would parse the SQL ENUM and then conver it into a typescript
  // ENUM or A typescript String Literal Type.

  public write(): void {
    const interfaces = this.tablesToInterfaces()
    // a+: Open file for reading and appending. The file is created if it does not exist.
    fs.writeFile("./database.types.ts", interfaces.join(" "), (err) => {
      if (err) { 
          console.error(err)
          throw err
      }
    })

  }
}

const b = new BioQuerySQLParser()

b.write()
