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

        const uncleanedTableDetails: BioQueryParser.UncleanedTableDetails= {
          types: [],
          columns: []
        }

        for (const x of uncleanedColumns) {
          const column = x.split(" ")[0]

          uncleanedTableDetails.columns.push(column)
          for (const y in this.sqlTypes) {
            const isMatch = x.match(y)?.[0]
            if (isMatch) {
              const type = y as keyof BioQueryParser.SqlAndTs
              const tsTypeValue = this.sqlTypes[type]
              uncleanedTableDetails.types.push({ sql: isMatch, ts: tsTypeValue })
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

  private tablesToInterfaces (): string[] {
    const stringedTables: string[] = []

    const tables = this.clean()

    if (!tables) throw new Error("Cannot write to file because the tables dont exist")
    
    for (const table of tables) {
      const stringifiedColumns: string[] = []
      for (const column of table.columns) {
        stringifiedColumns.push(`  ${column.name}: ${column.type}`)
      }

      stringedTables.push(`\ninterface TABLE_${table.name.toUpperCase()} {\n${stringifiedColumns.join("\n")}\n}\n`)
    }

    return stringedTables
  }

  public write(): void {
    const interfaces = this.tablesToInterfaces()
    // a+: Open file for reading and appending. The file is created if it does not exist.
    fs.writeFile("./database.types.ts", interfaces.join(" "), { flag: "a+" }, (err) => {

      if (err) { 
          console.error(err)
          throw err
      }

    })

  }
}

const b = new BioQuerySQLParser()

b.write()
