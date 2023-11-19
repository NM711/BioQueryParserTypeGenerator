import type BioQueryParser from "./parser.types"

/**
 * @class SQLCustomTypeParser
 * @description
 * Class that parses custom made SQL types, such as ENUMS, RANGES, etc.
 */

class SQLCustomTypeParser {
  public sqlCustomTypes: BioQueryParser.CustomTypes

  constructor () {
    this.sqlCustomTypes = [] 
  }

  set generateCustomTypeToken (args: BioQueryParser.CustomType) {
    this.sqlCustomTypes.push(args)
  }

  private async parseCustomTypes(unformatted: string[]): Promise<void> {
  // look for keywords such as "ENUM"
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

        this.generateCustomTypeToken = { name: name.toUpperCase(), type: "ENUM", fields }
      }
    }
  }

  private createEnumString (name: string, values: string) {
    return `\nenum ${name} {\n${values}\n}`
  }

  public async customTypeToTypeTS (unformatted: string[]): Promise<string[]> {
    this.parseCustomTypes(unformatted)
    const typesToWrite: string[] = []

    for (const customTypeToken of this.sqlCustomTypes) {
      if (customTypeToken.type === "ENUM") {
        const builtEnumStrings: string[] = []
        for (const field of customTypeToken.fields) {
          const fieldName = field.replace(/["']/g, "").toUpperCase()

          builtEnumStrings.push(`${fieldName.replace(/["']/g, "")} = ${field},\n`)
        }
        const builtEnum = this.createEnumString(customTypeToken.name.replace(/["']/g, ""), builtEnumStrings.join(""))
        typesToWrite.push(builtEnum)
      }

      if (customTypeToken.type === "RANGES") {

      }

      if (customTypeToken.type === "CUSTOM") {

      }
    }

    return typesToWrite
  }
}

export default SQLCustomTypeParser
