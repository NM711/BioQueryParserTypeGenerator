import BuilderTypes from "../types/builder"
import LexerTypes from "../types/lexer.types"

class TypeBuilderTS {
  private built: string[]
  private sqlTypes: typeof LexerTypes.sqlTypes & Record<string, string>
  private kysleyBuildMode: boolean

  constructor () {
    this.built = []
    this.sqlTypes = LexerTypes.sqlTypes
    this.kysleyBuildMode = false
  }

  /***
   * @method setCustomSqlTypes
   * @param types
   * @type typeof this.sqltypes & object
   * @description
   * Provided method that allows for me to add the this.sqlTypes object, that was updated within the Lexer object for
   * use within this TypeBuilderTS Class.
   * */

  public set setCustomSqlTypes (types: typeof this.sqlTypes & object) {
    this.sqlTypes = types
  }

  /***
   * @method tsTypesBuilder
   * @param { name, value, mode }
   * @type TSBuilderParams
   * @description
   * Private method that allows me to easily switch modes to build specific typescript types. These types can be interfaces,
   * types, etc.
   * 
   * @example
   * this.tsTypesBuilder({ name: "RandomTypeName", values: ["Cars", "Motorcycles", "Airplanes"], mode: "TYPE" })
   * OUTPUT EXAMPLE: `\ntype "RandomTypeName" = "Cars" | "Motorcycles" | "Airplanes" \n`
   **/
  
  private tsTypesBuilder({ name, values, mode }: BuilderTypes.TSBuilderParams): string {
    switch (mode) {
      case "INTERFACE": {
        return `\nexport interface ${name} {\n${values}\n}\n`
      }

      case "TYPE": {
        return `\nexport type ${name} = ${values}\n`
      }

      default: {
        return "NO VALID MODE PROVIDED!"
      }
    }
  }

  private tableInterfaceBuilder (table: LexerTypes.TableDataToken): void {
    let tableInterfaceFields: string[] = []
    for (const column of table.columns) {
      const tsType = this.sqlTypes[column.type]
      if (!tsType) throw Error("Something went wrong while looking up the given type!")
      let interfaceField = `  ${column.name}?: ${tsType}`
      // for the kysley mode, this switch will have a greater role
      switch (true) {
        case column.constraints.has("UNIQUE") || column.constraints.has("NOT NULL"): {
          interfaceField = interfaceField.replace("?", "")
        }

        case column.constraints.has("DEFAULT"): {
          if (this.kysleyBuildMode) {
            interfaceField += ` | Generated<${tsType}>`
          }
        }
      }

      tableInterfaceFields.push(interfaceField)
    }

    const tableInterface = this.tsTypesBuilder({ name: `${table.name}Table`, values: tableInterfaceFields.join("\n"), mode: "INTERFACE" })
    this.built.push(tableInterface)
  }

  /**
  * @method buildTypes 
  * @param tokens
  * @type LexerTypes.Token[]
  * @description
  * Public method that parses all of the tokens built by the lexer, in order to generate valid typescript
  * interfaces and types.
  * */

  public buildTypes (tokens: LexerTypes.Token[]) {
    for (const token of tokens) {

      switch (token.token_id) {
        case LexerTypes.TokenType.ENUM: {
          const literalValues = token.value.join(" | ")
          const literalType = this.tsTypesBuilder({ name: token.name, values: literalValues, mode: "TYPE" })

          this.built.push(literalType)
          break
        }

        case LexerTypes.TokenType.RANGE: {
          break
        }

        case LexerTypes.TokenType.CUSTOM_TYPE: {
          break
        }

        case LexerTypes.TokenType.TABLE: {
          this.tableInterfaceBuilder(token)
          break
        }
      }
    }
  }

  public get retrieveBuilt() {

    return this.built
  }

  public set setMode (argMode: string) {
    if (argMode === "kysley") {
      this.kysleyBuildMode = true
    }
  }
}

export default TypeBuilderTS
