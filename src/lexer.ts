import LexerTypes from "../types/lexer.types"
import { fieldSplitFormatter, formatTypeName, schemaRegex } from "./utils"

class SchemaLexer {
  private tokens: LexerTypes.Token[];
  private declaredColumnKeywords: Set<LexerTypes.KeywordKey>;
  private sqlTypes: typeof LexerTypes.sqlTypes & Record<string, string>;
  private sqlTypesKeys: string[];
  private sqlTypesKeysSet: Set<string>;

  constructor () {
    this.tokens = [];
    this.declaredColumnKeywords = new Set(Object.keys(LexerTypes.Keywords) as LexerTypes.KeywordKey[]);
    this.sqlTypes = LexerTypes.sqlTypes;
    this.sqlTypesKeys = Object.keys(this.sqlTypes);
    this.sqlTypesKeysSet = new Set(Object.keys(this.sqlTypes));
  };

  private reloadSqlTypesKeysSet(): this {
    this.sqlTypesKeysSet = new Set(this.sqlTypesKeys)
    return this;
  };

  /**
   * @method updateSqlTypesKeys
   * @param value
   * @type string | string[]
   * @description
   * Private setter method used to update the keys of the sqlTypesKeys array.
   */

  private set updateSqlTypesKeys(value: string | string[]) {
    if (typeof value === "object") this.sqlTypesKeys.push(...value);
    else this.sqlTypesKeys.push(value);
  };

  /**
   * @method commentRemoverAndStringFormatter
   * @param unformatted
   * @type string
   * @description
   * Private method that takes the entirety of the BioQuerySchema.sql as a string then, removes the comments via regex and lastly
   * returns the updated comment free, schema string.
   */

  private commentRemoverAndStringFormatter (unformatted: string): string {
    // removes all whitespace that occurs within the instance of new line
    unformatted = unformatted.replace(/^\s+/gm, "")

    if (schemaRegex.comment.test(unformatted)) {
        unformatted = unformatted.replace(schemaRegex.comment, "\n");
    };

    // Must deliver a formatted string that the tokenizers can read

    const splitUnformatted = unformatted.split("\n");

    for (let i = 0; i <= splitUnformatted.length; i++) {
      const word = splitUnformatted[i];

      if (word === "" || !word) continue;

      if (!word.includes("CREATE") && word !== ");") {
        let doubleIndent = "  ";
        splitUnformatted[i] = doubleIndent += word;
      };
    };

    unformatted = splitUnformatted.join("\n");

    return unformatted;
  }

  private tokenizeCustomType (decalaredCustomType: string[]) {
    for (const customType of decalaredCustomType) {
      const typeFieldArr: LexerTypes.CustomTokenTypeField[] = [];

      const brokenDownString = customType.split(/CREATE TYPE(.*?)AS/g)
      const typeName = brokenDownString[1]
      if (!brokenDownString[2]) continue

      const restOfString = brokenDownString[2].replace(/[\)\(\,;\s]/g, "").split(/\'(.*?)\'/g)
      const declaredType = restOfString.shift()

      if (!declaredType) continue

      const formattedCustomTypeName = formatTypeName(typeName.trim().replace(/["]/g, ""))
      this.updateSqlTypesKeys = typeName.trim()
      
      switch (declaredType) {
       
        case LexerTypes.TokenType.ENUM || LexerTypes.TokenType.ENUM.toLowerCase():
          const typeValuesThatWereSet = restOfString.filter(f => f !== "").map(t => {
            if (typeof t === "number") return Number(t)
            return `"${t}"`
          }) as string[] | number[]

          this.tokens.push({
            token_id: LexerTypes.TokenType.ENUM,
            name: formattedCustomTypeName,
            value: typeValuesThatWereSet
          })
        break


       // case LexerTypes.TokenType.RANGE || LexerTypes.TokenType.RANGE.toLowerCase():
       // break


        default: {
          const fields = fieldSplitFormatter(brokenDownString[2]);
          for (const field of fields) {
            const trimmedField = field.replace(/[(),;]/g, "").trim();
            if (trimmedField.length === 1) continue;
            const splitField = trimmedField.split(" ");

            if (!splitField[0] || !splitField[1]) continue;
            
            const fieldName = splitField[0];
            const fieldType = splitField[1];
            
            typeFieldArr.push({
              name: fieldName,
              type: fieldType
            });
          };

          this.tokens.push({
            token_id: LexerTypes.TokenType.CUSTOM_TYPE,
            name: formattedCustomTypeName,
            value: typeFieldArr
          });
        };
      };
    };
  };

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
        this.reloadSqlTypesKeysSet();
        // word level iteration
        for (let i = 0; i <= splitCol.length; i++) {
          const word = splitCol[i] ? splitCol[i].trim() : ""
          const nextWord = splitCol[i + 1] ? splitCol[i + 1].trim() : ""

          const unionizedKeyword = `${word} ${nextWord}` as LexerTypes.KeywordKey

          if (this.sqlTypesKeysSet.has(word)) { 
            columnType = word
          }

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
      const splitTable = table.split(schemaRegex.table)
      const tableName = splitTable[1].trim()
      // d+ = one or more digits compared to \d digit
      const tableColumns = fieldSplitFormatter(splitTable[2])
      const columnTokens = this.tokenizeColumns(tableColumns)
      this.tokens.push({
        token_id: LexerTypes.TokenType.TABLE,
        name: tableName.replace(/["]/g, ""),
        columns: columnTokens
      })
  }
}

  private matchRegex(key: keyof typeof schemaRegex, dataToTest: string): boolean {
    const isMatch = dataToTest.match(schemaRegex[key])
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
        this.sqlTypes[key] = formatTypeName(key.replace(/["]/g, ""))
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
    const cleansed = this.commentRemoverAndStringFormatter(unformatted)
    this.tokenize(cleansed)
    return this.tokens
  }
}

export default SchemaLexer
