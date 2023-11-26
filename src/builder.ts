import LexerTypes from "../types/lexer.types"

interface TSBuilderParams {
  name: string,
  values: string,
  mode: "INTERFACE" | "TYPE"
}

class TypeBuilderTS {
  private built: string[]
  private sqlTypes

  constructor () {
    this.built = []
    this.sqlTypes = LexerTypes.sqlTypes
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
  
  private tsTypesBuilder({ name, values, mode }: TSBuilderParams): string {
    switch (mode) {
      case "INTERFACE": {
        return `\ninterface ${name} {\n${values}\n}\n`
      }

      case "TYPE": {
        return `\ntype ${name} = ${values}\n`
      }

      default: {
        return "NO VALID MODE PROVIDED!"
      }
    }
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
      switch (true) {

        case token.token_id === LexerTypes.TokenType.ENUM: {
          const literalValues = token.value.join(" | ")
          const literalType = this.tsTypesBuilder({ name: token.name, values: literalValues, mode: "TYPE" })

          this.built.push(literalType)
          break
        }

        case token.token_id === LexerTypes.TokenType.CUSTOM_TYPE: {
          break
        }

        case token.token_id === LexerTypes.TokenType.TABLE: {
          const formattedColumns: string[] = []
          for (const col of token.columns) {
          }

          break
        }

      }
    }

    console.log(this.built)
  }

  public get retrieveBuilt() {
    return this.built
  }

}

export default TypeBuilderTS
