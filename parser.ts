import * as sqlAndTsTypes from "./sql_types.json"
import SQLTableParser from "./tablesTypes"
import SQLCustomTypeParser from "./customTypes"
import fs from "node:fs"
import BioQueryParser from "./parser.types"

// 1. First thing we must do is parse the custom types, this way we can create the enums and then assign them depending on wether
// a column on a table has it assigned.

class BioQuerySQLParser {
  constructor () {}

  private read(): string {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  private execute (unformatted: string[]): string {
    const customTypes = new SQLCustomTypeParser()
    const customTypesToWrite = customTypes.customTypeToTypeTS(unformatted)
    const updatedTypes = customTypes.getUpdatedTypes
    const tableTypes = new SQLTableParser(updatedTypes)
    const tablesInterfacesToWrite = tableTypes.tablesToInterfacesTS(unformatted)
    return [ ...customTypesToWrite, ...tablesInterfacesToWrite ].join(" ")
  }

  public async write(): Promise<void> {
    console.time("Performance")
    const unformatted = this.read().replace(/[\n\s]/g, "").split(";")
    const data = this.execute(unformatted)
    fs.writeFile("./database.types.ts", data, (err) => {
      if (err) console.error(err)
    })
    console.timeEnd("Performance")
  }
}

const b = new BioQuerySQLParser()

b.write()
