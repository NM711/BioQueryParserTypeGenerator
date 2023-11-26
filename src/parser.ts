import TypeBuilderTS from "./builder"
import SchemaLexer from "./lexer"
import fs from "node:fs"

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

  public write () {
    const unformatted = this.read()
    const tokens = this.lexer.execute(unformatted)
    this.builder.buildTypes(tokens)
  }
}

export default SchemaParser
