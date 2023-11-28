import LexerTypes from "../types/lexer.types"

class SchemaLexer {
  private tokens: LexerTypes.Token[]
  private regex: LexerTypes.Regex
  private declaredColumnKeywords: Set<LexerTypes.KeywordKey>
  private sqlTypes: typeof LexerTypes.sqlTypes & Record<string, string>
  private sqlTypesKeys: string[]

  constructor () {
    this.regex = this.generateRegex
    this.tokens = []
    this.declaredColumnKeywords = new Set(Object.keys(LexerTypes.Keywords) as LexerTypes.KeywordKey[])
    this.sqlTypes = LexerTypes.sqlTypes
    this.sqlTypesKeys = Object.keys(this.sqlTypes)
  }

  /**
  * @method generateRegex
  * @description
  * Private gette method used for the intialization of this.regex, this way I dont bloat the constructor.
  * The provided regex data is used for parsing the schema and breaking up the relevant parts into smaller, more digestable
  * pieces.
  * */

  private get generateRegex(): LexerTypes.Regex {
    return {
      table: /CREATE TABLE(.*?)\(/g,
      column: /[,\n]/g,
      custom_type: /CREATE TYPE\s/g,
      comment: /--(.*?)\n/
    }
  }

  /**
   * @method updateSqlTypesKeys
   * @param value
   * @type string | string[]
   * @description
   * Private setter method used to update the keys of the sqlTypesKeys array.
   */

  private set updateSqlTypesKeys(value: string | string[]) {
    if (typeof value === "object") this.sqlTypesKeys.push(...value)
    else this.sqlTypesKeys.push(value)
  }

  /**
   * @method commentRemover
   * @param unformatted
   * @type string
   * @description
   * Private method that takes the entirety of the BioQuerySchema.sql as a string then, removes the comments via regex and lastly
   * returns the updated comment free, schema string.
   */

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
      this.updateSqlTypesKeys = typeName.trim()

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

  private tokenizeColumns (tableColumns: string[]): LexerTypes.ColumnDataToken[] {
     const columnTokens: LexerTypes.ColumnDataToken[] = []
      // column level iteration
      for (const column of tableColumns) {
        if (column === "") continue
        const splitCol = column.split(" ")
        const columnName = splitCol[2]

        if (!columnName) continue

        let setOfColumnConstraints: Set<LexerTypes.KeywordKey> = new Set()
        let columnType: string = ""
        const sqlTypesKeysSet = new Set(this.sqlTypesKeys)
        // word level iteration
        for (let i = 0; i <= splitCol.length; i++) {
          const word = splitCol[i] ? splitCol[i].trim() : ""
          const nextWord = splitCol[i + 1] ? splitCol[i + 1].trim() : ""

          const unionizedKeyword = `${word} ${nextWord}` as LexerTypes.KeywordKey

          if (sqlTypesKeysSet.has(word)) columnType = word

          if (this.declaredColumnKeywords.has(word as LexerTypes.KeywordKey)) {
              setOfColumnConstraints.add(word as LexerTypes.KeywordKey)
          }

          if (this.declaredColumnKeywords.has(unionizedKeyword)) {
             setOfColumnConstraints.add(unionizedKeyword)
          }

      }

      columnTokens.push({
        token_id: LexerTypes.TokenType.COLUMN,
        type: columnType,
        name: columnName,
        constraints: setOfColumnConstraints
      })
    }

    return columnTokens
  }

  private tokenizeTablesAndColumns (tables: string[]) {
    // table level iteration
    for (const table of tables) {
      const splitTable = table.split(this.regex.table)
      const tableName = splitTable[1].trim()
      // d+ = one or more digits compared to \d digit
      const tableColumns = splitTable[2].replace(/\(\d+\)/g, "").split(this.regex.column)

      const columnTokens = this.tokenizeColumns(tableColumns)

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

  /**
   * @method tokenize
   * @param data
   * @type string
   * @description
   * Private method that tokenizes everything of relevance within the, BioQuerySchema.sql file.
   *
   * @example
   * Example output:
   * {
       token_id: 'TABLE',
        name: 'StaffUser',
        columns: [ [Object], [Object], [Object], [Object] ]
     }
   *
   */

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


  /**
  * @method buildSqlTypes
  * @description
  * Builds the sqlTypes object with new added custom types and its typescript definition.
  * This can be used before running the retrieveSqlTypes getter.
  * */

  private buildSqlTypes() {
    for (const key of this.sqlTypesKeys) {
      if (!this.sqlTypes[key as keyof typeof this.sqlTypes]) {
        this.sqlTypes[key] = this.formatName(key)
      }
    }
  }
  
  /**
   * @method retrieveSqlTypes
   * @description
   * Getter method that returns the set sqlTypes, this can come in handy when there is custom types
   * that need to be moved from this class to another.
   */

  public get retrieveSqlTypes() {
    this.buildSqlTypes()
    return this.sqlTypes
  }

  /**
   * @method execute
   * @param unformatted
   * @type string
   * @description
   * Public method that executes the tokenizers after, being provided the BioQuerySchema.sql files unformatted data as a string
   **/

  public execute (unformatted: string) {
    const cleansed = this.commentRemover(unformatted)
    this.tokenize(cleansed)
    return this.tokens
  }
}

export default SchemaLexer
