"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_types_1 = __importDefault(require("../types/lexer.types"));
const utils_1 = require("./utils");
class SchemaLexer {
    constructor() {
        this.regex = this.generateRegex;
        this.tokens = [];
        this.declaredColumnKeywords = new Set(Object.keys(lexer_types_1.default.Keywords));
        this.sqlTypes = lexer_types_1.default.sqlTypes;
        this.sqlTypesKeys = Object.keys(this.sqlTypes);
    }
    /**
    * @method generateRegex
    * @description
    * Private gette method used for the intialization of this.regex, this way I dont bloat the constructor.
    * The provided regex data is used for parsing the schema and breaking up the relevant parts into smaller, more digestable
    * pieces.
    * */
    get generateRegex() {
        return {
            table: /CREATE TABLE(.*?)\(/g,
            column: /[,\n]/g,
            custom_type: /CREATE TYPE\s/g,
            comment: /--(.*?)\n/g,
        };
    }
    /**
     * @method updateSqlTypesKeys
     * @param value
     * @type string | string[]
     * @description
     * Private setter method used to update the keys of the sqlTypesKeys array.
     */
    set updateSqlTypesKeys(value) {
        if (typeof value === "object")
            this.sqlTypesKeys.push(...value);
        else
            this.sqlTypesKeys.push(value);
    }
    /**
     * @method commentRemoverAndStringFormatter
     * @param unformatted
     * @type string
     * @description
     * Private method that takes the entirety of the BioQuerySchema.sql as a string then, removes the comments via regex and lastly
     * returns the updated comment free, schema string.
     */
    commentRemoverAndStringFormatter(unformatted) {
        // removes all whitespace that occurs within the instance of new line
        unformatted = unformatted.replace(/^\s+/gm, "");
        if (this.regex.comment.test(unformatted)) {
            unformatted = unformatted.replace(this.regex.comment, "\n");
        }
        ;
        // Must deliver a formatted string that the tokenizers can read
        const splitUnformatted = unformatted.split("\n");
        for (let i = 0; i <= splitUnformatted.length; i++) {
            const word = splitUnformatted[i];
            if (word === "" || !word)
                continue;
            if (!word.includes("CREATE") && word !== ");") {
                let doubleIndent = "  ";
                splitUnformatted[i] = doubleIndent += word;
            }
            ;
        }
        ;
        unformatted = splitUnformatted.join("\n");
        return unformatted;
    }
    tokenizeCustomType(decalaredCustomType) {
        for (const customType of decalaredCustomType) {
            const brokenDownString = customType.split(/CREATE TYPE(.*?)AS/g);
            const typeName = brokenDownString[1];
            if (!brokenDownString[2])
                continue;
            const restOfString = brokenDownString[2].replace(/[\)\(\,;\s]/g, "").split(/\'(.*?)\'/g);
            const declaredType = restOfString.shift();
            if (!declaredType)
                continue;
            const formattedCustomTypeName = (0, utils_1.formatTypeName)(typeName.trim().replace(/["]/g, ""));
            this.updateSqlTypesKeys = typeName.trim();
            const typeValuesThatWereSet = restOfString.filter(f => f !== "").map(t => {
                if (typeof t === "number")
                    return Number(t);
                return `"${t}"`;
            });
            switch (declaredType) {
                case lexer_types_1.default.TokenType.ENUM || lexer_types_1.default.TokenType.ENUM.toLowerCase():
                    this.tokens.push({
                        token_id: lexer_types_1.default.TokenType.ENUM,
                        name: formattedCustomTypeName,
                        value: typeValuesThatWereSet
                    });
                    break;
                // still needs to be implemented, will work on it depending if i need it for my project and what not
                case lexer_types_1.default.TokenType.RANGE || lexer_types_1.default.TokenType.RANGE.toLowerCase():
                    break;
                default: {
                    // look for a custom type that is not an enum or range, etc.
                }
            }
        }
    }
    tokenizeColumns(tableColumns) {
        const columnTokens = [];
        // column level iteration
        for (const column of tableColumns) {
            if (column === "")
                continue;
            const splitCol = column.split(" ");
            const columnName = splitCol[2];
            if (!columnName)
                continue;
            let setOfColumnConstraints = new Set();
            let columnType = "";
            const sqlTypesKeysSet = new Set(this.sqlTypesKeys);
            // word level iteration
            for (let i = 0; i <= splitCol.length; i++) {
                const word = splitCol[i] ? splitCol[i].trim() : "";
                const nextWord = splitCol[i + 1] ? splitCol[i + 1].trim() : "";
                const unionizedKeyword = `${word} ${nextWord}`;
                if (sqlTypesKeysSet.has(word))
                    columnType = word;
                if (this.declaredColumnKeywords.has(word)) {
                    setOfColumnConstraints.add(word);
                }
                if (this.declaredColumnKeywords.has(unionizedKeyword)) {
                    setOfColumnConstraints.add(unionizedKeyword);
                }
            }
            columnTokens.push({
                token_id: lexer_types_1.default.TokenType.COLUMN,
                type: columnType,
                name: columnName,
                constraints: setOfColumnConstraints
            });
        }
        return columnTokens;
    }
    tokenizeTablesAndColumns(tables) {
        // table level iteration
        for (const table of tables) {
            const splitTable = table.split(this.regex.table);
            const tableName = splitTable[1].trim();
            // d+ = one or more digits compared to \d digit
            const tableColumns = splitTable[2].replace(/\(\d+\)/g, "").split(this.regex.column);
            const columnTokens = this.tokenizeColumns(tableColumns);
            this.tokens.push({
                token_id: lexer_types_1.default.TokenType.TABLE,
                name: tableName.replace(/["]/g, ""),
                columns: columnTokens
            });
        }
    }
    matchRegex(key, dataToTest) {
        const isMatch = dataToTest.match(this.regex[key]);
        if (!isMatch)
            return false;
        return true;
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
    tokenize(data) {
        const tables = [];
        const customTypes = [];
        const dividedSchema = data.split(/;\n/g);
        for (const block of dividedSchema) {
            switch (true) {
                case this.matchRegex("table", block): {
                    tables.push(block);
                }
                case this.matchRegex("custom_type", block): {
                    customTypes.push(block);
                }
            }
        }
        this.tokenizeCustomType(customTypes);
        this.tokenizeTablesAndColumns(tables);
    }
    /**
    * @method buildSqlTypes
    * @description
    * Builds the sqlTypes object with new added custom types and its typescript definition.
    * This can be used before running the retrieveSqlTypes getter.
    * */
    buildSqlTypes() {
        for (const key of this.sqlTypesKeys) {
            if (!this.sqlTypes[key]) {
                this.sqlTypes[key] = (0, utils_1.formatTypeName)(key.replace(/["]/g, ""));
            }
        }
    }
    /**
     * @method retrieveSqlTypes
     * @description
     * Getter method that returns the set sqlTypes, this can come in handy when there is custom types
     * that need to be moved from this class to another.
     */
    get retrieveSqlTypes() {
        this.buildSqlTypes();
        return this.sqlTypes;
    }
    /**
     * @method execute
     * @param unformatted
     * @type string
     * @description
     * Public method that executes the tokenizers after, being provided the BioQuerySchema.sql files unformatted data as a string
     **/
    execute(unformatted) {
        const cleansed = this.commentRemoverAndStringFormatter(unformatted);
        this.tokenize(cleansed);
        return this.tokens;
    }
}
exports.default = SchemaLexer;
