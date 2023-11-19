import * as sqlAndTsTypes from "./sql_types.json"
import SQLTableParser from "./tablesTypes"
import SQLCustomTypeParser from "./customTypes"
import fs from "node:fs"

class BioQuerySQLParser {
  // havent done anything for range yet, depending on how big this gets might need to
  // make a seperate class for parsing the custom types
  private tableParser: SQLTableParser
  private customTypeParser: SQLCustomTypeParser
  constructor () {
    this.customTypeParser = new SQLCustomTypeParser()
    this.tableParser = new SQLTableParser(sqlAndTsTypes.sql_types)
  }

  private read(): string {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  public async write(): Promise<void> {
    console.time("Performance")
    const unformatted = this.read().replace(/[\n\s]/g, "").split(";")
    const types = await this.customTypeParser.customTypeToTypeTS(unformatted)
    const interfaces = await this.tableParser.tablesToInterfacesTS(unformatted)

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
