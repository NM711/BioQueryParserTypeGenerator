import SchemaLexer from "./lexer"
import fs from "node:fs"

class SchemaParser {
  private lexer: SchemaLexer
  constructor () {
    this.lexer = new SchemaLexer()
  }

  public read () {
    const data = fs.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" })
    return data
  }

  public write () {
    const unformatted = this.read()
    this.lexer.execute(unformatted)
  }
}

const parser = new SchemaParser().write()
