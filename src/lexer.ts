import LexerTypes from "../types/lexer.types"

class SchemaLexer {
  private tokens: LexerTypes.Token[]
  private regex: LexerTypes.Regex
  private columnKeywords: Set<LexerTypes.KeywordKey>
  private sqlTypes: string[]

  constructor () {
    this.regex = this.generateRegex
    this.tokens = []
    this.columnKeywords = new Set(Object.keys(LexerTypes.Keywords) as LexerTypes.KeywordKey[])
    this.sqlTypes = Object.keys(LexerTypes.sqlTypes)
  }

  private get generateRegex(): LexerTypes.Regex {
    return {
      table: /CREATE TABLE(.*?)\(/g,
      column: /[,\n]/g,
      custom_type: /CREATE TYPE\s/g,
      comment: /--(.*?)\n/
    }
  }

  private set updateSqlTypes(value: string | string[]) {
    if (typeof value === "object") this.sqlTypes.push(...value)
    else this.sqlTypes.push(value)
  }

  private commentRemover (unformatted: string): string {
    if (this.regex.comment.test(unformatted)) {
        unformatted = unformatted.replace(this.regex.comment, "")
    }

    return unformatted
  }

  private formatName (str: string): string {
    const splitName = str.toLowerCase().trim().split(/[_-]/g)
    let name = ""

    for (const n of splitName) {
      name += n.charAt(0).toUpperCase() + n.slice(1)
    }
    return name
  }

  private tokenizeCustomType (decalaredCustomType: string[]) {
    for (const customType of decalaredCustomType) {
      const brokenDownString = customType.split(/CREATE TYPE(.*?)AS/g)
      const typeName = brokenDownString[1]
      if (!brokenDownString[2]) continue

      const restOfString = brokenDownString[2].replace(/[\)\(\,;\s]/g, "").split(/\'(.*?)\'/g)
      const declaredType = restOfString.shift()

      if (!declaredType) continue
      this.updateSqlTypes = typeName.trim()

      const typeValuesThatWereSet = restOfString.filter(f => f !== "").map(t => {
        if (typeof t === "number") return Number(t)
        return `"${t}"`
      }) as string[] | number[]

      switch (declaredType) {
       case LexerTypes.TokenType.ENUM || LexerTypes.TokenType.ENUM.toLowerCase():
         this.tokens.push({
           token_id: LexerTypes.TokenType.ENUM,
           name: this.formatName(typeName),
           value: typeValuesThatWereSet
         })
        break
        // still needs to be implemented, will work on it depending if i need it for my project and what not
        case LexerTypes.TokenType.RANGE || LexerTypes.TokenType.RANGE.toLowerCase():
        break
        default: {
        // look for a custom type that is not an enum or range, etc.
        }
      }
    }
  }

  private tokenizeTablesAndColumns (tables: string[]) {
    // table level iteration
    for (const table of tables) {
      const splitTable = table.split(this.regex.table)
      const tableName = splitTable[1].trim()
      // d+ = one or more digits compared to \d digit
      const tableColumns = splitTable[2].replace(/\(\d+\)/g, "").split(this.regex.column)


      const columnTokens: LexerTypes.ColumnDataToken[] = []
      // column level iteration
      for (const column of tableColumns) {
        if (column === "") continue
        const splitCol = column.split(" ")
        const columnName = splitCol[2]

        if (!columnName) continue

        let columnConstraints: LexerTypes.KeywordKey[] = []
        let columnType: string = ""
        const sqlTypesSet = new Set(this.sqlTypes)
        // word level iteration
        for (let i = 0; i <= splitCol.length; i++) {
          const word = splitCol[i] ? splitCol[i].trim() : ""
          const nextWord = splitCol[i + 1] ? splitCol[i + 1].trim() : ""

          const unionizedKeyword = `${word} ${nextWord}` as LexerTypes.KeywordKey

          if (sqlTypesSet.has(word)) columnType = word

          if (this.columnKeywords.has(word as LexerTypes.KeywordKey)) {
              columnConstraints.push(word as LexerTypes.KeywordKey)
          }

          if (this.columnKeywords.has(unionizedKeyword)) {
             columnConstraints.push(unionizedKeyword)
          }

      }

      columnTokens.push({
        token_id: LexerTypes.TokenType.COLUMN,
        type: columnType,
        name: columnName,
        constraints: columnConstraints
      })
    }

    this.tokens.push({
      token_id: LexerTypes.TokenType.TABLE,
      name: this.formatName(tableName),
      columns: columnTokens
    })
  }
}

  private matchRegex(key: keyof typeof this.regex, dataToTest: string): boolean {
    const isMatch = dataToTest.match(this.regex[key])
    if (!isMatch) return false
    return true
  }

  private tokenize (data: string) {
    const tables: string[] = []
    const customTypes: string[] = []

    const dividedSchema = data.split(/;\n/g)

    for (const block of dividedSchema) {
      switch (true) {
        case this.matchRegex("table", block): {
          tables.push(block)
        }

        case this.matchRegex("custom_type", block): {
          customTypes.push(block)
        }
      }
    }

    this.tokenizeCustomType(customTypes)
    this.tokenizeTablesAndColumns(tables)
  }

  public execute (unformatted: string) {
    console.time("Tokenization Time")
    const cleansed = this.commentRemover(unformatted)
    this.tokenize(cleansed)
    console.timeEnd("Tokenization Time")
    return this.tokens
  }
}

export default SchemaLexer
