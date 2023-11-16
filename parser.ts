import * as sqlAndTsTypes from "./sql_types.json"
import fs from "node:fs"
import type BioQueryParser from "./parser.types"

// move these later on also work on renaming them
type CustomTypes = BioQueryParser.SqlEnum[] & BioQueryParser.SqlCustomType[]
type CustomType = BioQueryParser.SqlEnum<string> & BioQueryParser.SqlCustomType

class BioQuerySQLParser {
  private sqlTypes: BioQueryParser.SqlAndTs
  // havent done anything for range yet, depending on how big this gets might need to
  // make a seperate class for parsing the custom types
  private sqlCustomTypes: CustomTypes

  constructor () {
    this.sqlTypes = sqlAndTsTypes.sql_types
    this.sqlCustomTypes = []
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

  set setCustomType (args: CustomType) {
    this.sqlCustomTypes.push(args)
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
      const sqlType = typeString.split("(")[0]

      switch (true) {
        case /ENUM/.test(sqlType):
          const splitEnum = typeString.replace(/ENUM/g, '').split(/[(),]/);
          let fields: string[] = []
          for (const x of splitEnum) {
            // skip whitespace
            if (x.length === 0) continue
            fields.push(x)
          }

        this.setCustomType = { name: name.toUpperCase(), type: "ENUM", fields }
      }
    }
  }

  private createInterfaceString (name: string, types: string) {
    return `\ninterface ${name} {\n${types}\n}\n`
  }

  private createEnumString (name: string, values: string) {
    return `\nenum ${name} {\n${values}\n}`
  }

  private async customTypeToTypeTS (unformatted: string[]): Promise<string[]> {
    const typesToWrite: string[] = []
    
    for (const customTypeToken of this.sqlCustomTypes) {
      if (customTypeToken.type === "ENUM") {
        const builtEnumStrings: string[] = []
        for (const field of customTypeToken.fields) {
          const fieldName = field.replace(/[']/g, "").toUpperCase()

          builtEnumStrings.push(`${fieldName} = ${field},\n`)
        }
        const builtEnum = this.createEnumString(customTypeToken.name, builtEnumStrings.join(""))
        typesToWrite.push(builtEnum)
      }

      if (customTypeToken.type === "RANGES") {

      }

      if (customTypeToken.type === "CUSTOM") {

      }
    }

    return typesToWrite
  }

  private async tablesToInterfacesTS (unformatted: string[]): Promise<string[]> {
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
    const types = await this.customTypeToTypeTS(unformatted)
    const interfaces = await this.tablesToInterfacesTS(unformatted)

    const data = [...types, ...interfaces].join(" ")

    // a+: Open file for reading and appending. The file is created if it does not exist.
    fs.writeFile("./database.types.ts", data, (err) => {
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
