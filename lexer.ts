
enum TSTypes {
  NUMBER = "number",
  STRING = "string",
  DATE = "Date"
}

enum SQLTypes {
  "VARCHAR" = TSTypes.STRING,
  "TEXT" = TSTypes.STRING,
  "UUID" = TSTypes.STRING,
  "INTEGER" = TSTypes.NUMBER,
  "BIGINT" = TSTypes.NUMBER,
  "SMALLINT" = TSTypes.NUMBER,
  "SERIAL" = TSTypes.NUMBER,
  "TIMESTAMP" = `${TSTypes.DATE} | ${TSTypes.STRING}`
}

enum Keywords {
  "NOT NULL",
  "DEFAULT",
  "UNIQUE"
}

enum TokenType {
  TYPE = "TYPE",
  TABLE = "TABLE",
  COLUMN = "COLUMN",
}

interface ColumnData {
  name: string,
  type: keyof typeof SQLTypes | string,
  constraints: Keywords[]
}

interface TableData {
  name: string,
  columns: Token<ColumnData>[]
}

// normally everything in a sql schema has some form of a naming convention
// custom type name, table name, column name, etc.

interface Token<T = string> {
  type: TokenType
  value: T
}

interface Regex {
  table: RegExp,
  custom_type: RegExp,
  column: RegExp,
  comment: RegExp
}

type KeywordKey = keyof typeof Keywords

class SchemaLexer {
  private regex: Regex
  private tokens: Token[]
  private columnKeywords: Set<KeywordKey>
  private standardSqlTypes: Set<string>

  constructor () {
    this.regex = this.generateRegex
    this.tokens = []
    this.columnKeywords = new Set(Object.keys(Keywords) as KeywordKey[])
    this.standardSqlTypes = new Set(Object.keys(SQLTypes))
  }

  private get generateRegex(): Regex {
    return {
      table: /CREATE TABLE (.*?)\( /,
      column: /\s/, //,|\n\);/,
      custom_type: /CREATE TYPE ()\s/,
      comment: /--(.*?)\n/
    }
  }

  private commentRemover (unformatted: string): string {
    if (this.regexTest("comment", unformatted)) {
        unformatted = unformatted.replace(this.regex.comment, "")
    }

    return unformatted
  }

  private regexTest(key: keyof typeof this.regex, dataToTest: string): boolean {
    return this.regex[key].test(dataToTest)
  }

  private tokenizeColumns (columnFields: string[]) {
    for (const keyword of columnFields) {
      const keywords: Keywords[] = []
      const key = keyword as KeywordKey
      // empty per new column
      if (keyword === "," || keyword === ");") {
        keywords.length = 0
      }

      if (this.columnKeywords.has(key)) {
        keywords.push(Keywords[key])

        console.log(key)
      }
      console.log(keywords)
    }
  }

  private tokenize (data: string) {
    let formattedString: string = ""

    for (let i = 0; i <= data.length; i++) {
      const next = data[i + 1]
      const current = data[i]
      const columns: Token<ColumnData>[] = []

      // checking if current character is a space or not
      if (/\s/.test(current) && /\s/.test(next)) continue

      let tableName: string | string[] | null = null
      // helper
      const test = (key: keyof typeof this.regex) => this.regexTest(key, formattedString)

      if (test("table")) {
        const splitTable = formattedString.split(this.regex.table)
        tableName = splitTable[1]
        formattedString = formattedString.replace(this.regex.table, "")
      }

      if (test("column")) {
        const splitColumn = formattedString.split(this.regex.column)
        this.tokenizeColumns(splitColumn)
      }

      // this runs at the end.

      formattedString += current

    }
  }

  public execute (unformatted: string) {
    const cleansed = this.commentRemover(unformatted)
    this.tokenize(cleansed)
  }
}

export default SchemaLexer
