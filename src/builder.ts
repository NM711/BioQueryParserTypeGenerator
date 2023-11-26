import LexerTypes from "../types/lexer.types"

class TypeBuilderTS {
  private built: string[]

  constructor () {
    this.built = []
  }

  private tsTypeBuilder (name: string, value: string): string {
    return `\ntype ${name} = ${value}\n`
  }

  private tsInterfaceBuilder (name: string, values: string): string {
    return `\ninterface ${name} {${values}}\n`
  }

  public buildTypes (tokens: LexerTypes.Token[]) {

    for (const token of tokens) {
      switch (true) {

        case token.token_id === LexerTypes.TokenType.ENUM: {
          const literalValues = token.value.join(" | ")
          const literalType = this.tsTypeBuilder(token.name, literalValues)

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
  }

  public get retrieveBuilt() {
    return this.built
  }

}

export default TypeBuilderTS
