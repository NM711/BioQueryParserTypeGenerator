import * as sqlAndTsTypes from "./sql_types.json"
import fs from "node:fs"
import type BioQueryParser from "./parser.types"

type ObjectOfSqlCustomTypes = { enums: BioQueryParser.SqlEnum[], ranges: BioQueryParser.SqlCustomType[], custom: BioQueryParser.SqlCustomType[] }

function initCustomTypes (): ObjectOfSqlCustomTypes {
  return {
    enums: [],
    ranges: [],
    custom: []
  }
}

class BioQuerySQLParser {
  private sqlTypes: BioQueryParser.SqlAndTs
  // havent done anything for range yet, depending on how big this gets might need to
  // make a seperate class for parsing the custom types
  private sqlCustomTypes: ObjectOfSqlCustomTypes

  constructor () {
    this.sqlTypes = sqlAndTsTypes.sql_types
    this.sqlCustomTypes = initCustomTypes()
  }

  private read(): string {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  private async parseTables(unformatted: string[]): Promise<BioQueryParser.SqlTable[] | null> {
    try {
      const tables: BioQueryParser.SqlTable[] = []
      for (const t of unformatted) {
        // LOOK FOR CREATETABLE(.*?) -> GETS ANY IN BETWEEN THAT AND \(\g -> searches globally
        const createdTablesSplit = t.split(/CREATETABLE(.*?)\(/g)
        const name = createdTablesSplit[1]

        if (!name) continue

        const uncleanedColumns = createdTablesSplit[2].replace(/[\d()]/g, "").split(",").map(a => a.replace(/([a-z])([A-Z])/g, '\$1 \$2'))
        console.log(uncleanedColumns)
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

  set setEnums ({ name, type, fields }: BioQueryParser.SqlEnum<void>) {
    this.sqlCustomTypes.enums.push({
      name,
      type,
      fields
    })
  }
  
  // since im dealing with switches i wont return anything, rather ill just set the values
  // via a setter method and access later
  private async parseCustomTypes(unformatted: string[]): Promise<void> {
  // look for keywords such as "ENUM"
  // note that this method is looking somewhat similar to the one above so far,
  // consider breaking it up into private methods that i can use in both.
    for (const t of unformatted) {
      const createTypeSplit = t.split(/CREATETYPE(.*?)AS/g)

      const name = createTypeSplit[1]

      if (!name) continue
      const typeString = createTypeSplit[2]
      // this is maybe not the best solution but it will work for what im trying to do
      const type = typeString.split("(")[0]

      switch (true) {
        case /ENUM/.test(type):
          const splitEnum = typeString.replace(/ENUM/g, '').split(/[(),]/);
          let fields: string[] = []
          for (const x of splitEnum) {
            // skip whitespace
            if (x.length === 0) continue
            fields.push(x)
          }

        this.setEnums = { name, type: "ENUM", fields }
      }
    }
  }

  private createInterfaceString (name: string, types: string) {
    return `\ninterface ${name} {\n${types}\n}\n`
  }

  private async tablesToInterfaces (unformatted: string[]): Promise<string[]> {
    const interfacesToWrite: string[] = []
    
    let databaseTablesInterfaces: string = ""
    const tables = await this.parseTables(unformatted)

    if (!tables) throw new Error("Failed to parse tables!")
    
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

  public async write(): Promise<void> {
    console.time("Performance")
    const unformatted = this.read().replace(/[\n\s]/g, "").split(";")
    await this.parseCustomTypes(unformatted)
    const interfaces = await this.tablesToInterfaces(unformatted)
    // a+: Open file for reading and appending. The file is created if it does not exist.
    fs.writeFile("./database.types.ts", interfaces.join(" "), (err) => {
      if (err) { 
          console.error(err)
          throw err
      }
    })
    console.timeEnd("Performance")
  }
}

const b = new BioQuerySQLParser()

b.write()
