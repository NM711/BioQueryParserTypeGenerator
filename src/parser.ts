import TypeBuilderTS from "./builder"
import SchemaLexer from "./lexer"
import fs from "node:fs"
import process from "node:process"

class SchemaParser {
  private lexer: SchemaLexer
  private builder: TypeBuilderTS
  constructor () {
    this.lexer = new SchemaLexer()
    this.builder = new TypeBuilderTS()
  }

  private read () {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  private readCmdFlag (): string | null {
    const flags = process.argv.slice(2)
 
    const mode = flags[0]
    const value = flags[1]

    if (mode && mode === "--mode" || mode === "-m") {
        return value
    }

    return null
  }

  public write () {
    console.time("Performance")
    const builderMode = this.readCmdFlag()
    const unformatted = this.read()
    const tokens = this.lexer.execute(unformatted)
    const lexerSqlTypes = this.lexer.retrieveSqlTypes

    if (builderMode) {
      this.builder.setMode = builderMode
    }

    this.builder.setCustomSqlTypes = lexerSqlTypes
    this.builder.buildTypes(tokens)
    const builtTypes = this.builder.retrieveBuilt.join(" ")

    fs.writeFile("./database.types.ts", builtTypes, (err) => {
      if (err) console.error(err)
    })
    console.timeEnd("Performance")
  }
}

export default SchemaParser
