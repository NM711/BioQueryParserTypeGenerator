"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors/errors");
const lexer_types_1 = require("../../types/lexer.types");
class Parser {
    constructor() {
        this.tokens = [];
    }
    ;
    set setTokens(tokens) {
        this.tokens = tokens;
    }
    ;
    eat() {
        this.tokens.shift();
    }
    ;
    peek(index = 0) {
        return this.tokens[index];
    }
    ;
    expected(id, lexeme) {
        if (this.peek().id !== id) {
            throw new errors_1.SyntaxError(`Expected "${lexeme}" instead received "${this.peek().lexeme}"`, this.peek().info);
        }
        ;
        const v = this.peek();
        this.eat();
        return v;
    }
    ;
    // # TODO parse function calls
    parsePrimary() {
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.IDENT:
                return {
                    kind: "IDENTIFIER",
                    name: this.peek().lexeme
                };
            case lexer_types_1.TokenIdentifiers.NUMBER_LITERAL:
                return {
                    kind: "LITERAL",
                    value: this.peek().lexeme,
                    type: "NUMBER"
                };
            case lexer_types_1.TokenIdentifiers.STRING_LITERAL:
                return {
                    kind: "LITERAL",
                    value: this.peek().lexeme,
                    type: "STRING"
                };
            // since default can be set to null.
            case lexer_types_1.TokenIdentifiers.NULL:
                return {
                    kind: "LITERAL",
                    value: this.peek().lexeme,
                    type: "NULL"
                };
            default:
                throw new errors_1.SyntaxError(`Unexpected token at "${this.peek().lexeme}"`, this.peek().info);
        }
        ;
    }
    ;
    parseFunctionCall() {
        let lhs = this.parsePrimary();
        this.eat();
        if (this.peek().id === lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS) {
            this.eat();
            const functionArguments = [];
            while (this.peek() && this.peek().id !== lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS) {
                // parse args if there is any
                functionArguments.push(this.parsePrimary());
                this.eat();
            }
            ;
            this.expected(lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS, ")");
            this.expected(lexer_types_1.TokenIdentifiers.SEMICOLON, ";");
            lhs = {
                kind: "FUNCTION_CALL",
                called: lhs,
                arguments: functionArguments
            };
        }
        ;
        return lhs;
    }
    ;
    parseExpr() {
        return this.parseFunctionCall();
    }
    ;
    parseColumnConstraints() {
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.DEFAULT:
                {
                    this.eat();
                    const defaultedValue = this.parsePrimary();
                    this.eat();
                    if (defaultedValue.kind === "IDENTIFIER" && this.peek().id === lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS && this.peek(1).id === lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS) {
                        this.eat();
                        this.eat();
                    }
                    ;
                    return {
                        name: "DEFAULT",
                        value: defaultedValue
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.NOT:
                {
                    this.eat();
                    this.expected(lexer_types_1.TokenIdentifiers.NULL, "NULL");
                    return {
                        name: "NOT NULL"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.PRIMARY:
                {
                    this.eat();
                    this.expected(lexer_types_1.TokenIdentifiers.KEY, "KEY");
                    return {
                        name: "PRIMARY KEY"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.UNIQUE:
                {
                    this.eat();
                    return {
                        name: "UNIQUE"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.WITH:
                {
                    this.eat();
                    return {
                        name: "WITH"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.ZONE:
                {
                    this.eat();
                    return {
                        name: "ZONE"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.TIME:
                {
                    this.eat();
                    return {
                        name: "TIME"
                    };
                }
                ;
            case lexer_types_1.TokenIdentifiers.ON:
                {
                    this.eat();
                    if (this.peek().lexeme == "DELETE" || this.peek().lexeme == "UPDATE") {
                        const action = this.peek().lexeme;
                        this.eat();
                        this.expected(lexer_types_1.TokenIdentifiers.CASCADE, "Cascade");
                        return {
                            name: "ACTION",
                            action,
                            event: "CASCADE"
                        };
                    }
                    else {
                        throw new errors_1.SyntaxError("Expected a valid action or constraint!", this.peek().info);
                    }
                    ;
                }
                ;
            // implement one for foreign keys as well.
            case lexer_types_1.TokenIdentifiers.REFERENCES:
                {
                    this.eat();
                    const tableIdent = this.parsePrimary();
                    this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Referenced Table Identifier");
                    if (this.peek().id == lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS) {
                        this.eat();
                        const columnIdent = this.parsePrimary();
                        this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Referenced Column Identifier");
                        this.expected(lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS, ")");
                        return {
                            name: "REFERENCES",
                            refTable: tableIdent,
                            refColumn: columnIdent
                        };
                    }
                    ;
                    return {
                        name: "REFERENCES",
                        refTable: tableIdent,
                    };
                }
                ;
            default:
                {
                    throw new errors_1.SyntaxError(`Unexpected attribute or constraint found in "${this.peek().lexeme}"`, this.peek().info);
                }
                ;
        }
        ;
    }
    ;
    parseColumns() {
        const columns = [];
        while (true) {
            const colIdent = this.parsePrimary();
            this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Identifier");
            // expect col type, note this can be a custom type not necessarily only primitive
            const colType = this.parseFieldType();
            const column = {
                kind: "COLUMN",
                name: colIdent,
                type: colType,
                constraints: []
            };
            while (this.peek().id !== lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS && this.peek().id !== lexer_types_1.TokenIdentifiers.SEPERATOR) {
                column.constraints.push(this.parseColumnConstraints());
            }
            ;
            columns.push(column);
            if (this.peek().id === lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS) {
                break;
            }
            else {
                this.expected(lexer_types_1.TokenIdentifiers.SEPERATOR, ",");
            }
            ;
        }
        ;
        return columns;
    }
    ;
    /**
     * Parses table in schema file/files
     */
    parseTable() {
        this.eat();
        const ident = this.parsePrimary();
        this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Identifier");
        this.expected(lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS, "(");
        const columns = this.parseColumns();
        this.expected(lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS, ")");
        this.expected(lexer_types_1.TokenIdentifiers.SEMICOLON, ";");
        return {
            name: ident,
            columns
        };
    }
    ;
    parseFieldType() {
        const tableColType = {
            kind: "FIELD_TYPE",
            name: this.peek().lexeme
        };
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.VARCHAR:
                this.eat();
                this.expected(lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS, "(");
                const varcharLiteral = this.parsePrimary();
                this.eat();
                this.expected(lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS, ")");
                tableColType.additionalDetails = [];
                tableColType.additionalDetails.push(varcharLiteral);
                return tableColType;
            case lexer_types_1.TokenIdentifiers.TEXT:
            case lexer_types_1.TokenIdentifiers.TIMESTAMP:
            case lexer_types_1.TokenIdentifiers.TIMESTAMPZ:
            case lexer_types_1.TokenIdentifiers.DOUBLE:
            case lexer_types_1.TokenIdentifiers.UUID:
            case lexer_types_1.TokenIdentifiers.INT:
            case lexer_types_1.TokenIdentifiers.BOOLEAN:
            case lexer_types_1.TokenIdentifiers.BYTEA:
                this.eat();
                return tableColType;
            default:
                // if its an ident we suppose its a custom type, or enum, etc.
                this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Type Identifier");
                return tableColType;
        }
        ;
    }
    ;
    parseEnumType(ident) {
        this.eat();
        this.expected(lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS, "(");
        const values = [];
        while (true) {
            values.push(this.parsePrimary());
            this.eat();
            if (this.peek().id === lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS) {
                this.eat();
                break;
            }
            else {
                this.expected(lexer_types_1.TokenIdentifiers.SEPERATOR, ",");
            }
            ;
        }
        ;
        this.expected(lexer_types_1.TokenIdentifiers.SEMICOLON, ";");
        return {
            kind: "ENUM",
            name: ident,
            values
        };
    }
    ;
    parseObjectType(ident) {
        this.eat();
        const fields = [];
        while (true) {
            const field = this.parsePrimary();
            this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Object Field Identifier");
            const fieldType = this.parseFieldType();
            fields.push({
                name: field,
                type: fieldType
            });
            if (this.peek().id === lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS) {
                this.eat();
                break;
            }
            else {
                this.expected(lexer_types_1.TokenIdentifiers.SEPERATOR, ",");
            }
            ;
        }
        ;
        this.expected(lexer_types_1.TokenIdentifiers.SEMICOLON, ";");
        return {
            kind: "OBJECT_TYPE",
            name: ident,
            fields
        };
    }
    ;
    /**
     * Parses types in schema file (note: custom object types only work for postgresql)
     */
    parseType() {
        this.eat();
        const typeIdent = this.parsePrimary();
        this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Type Identifier");
        // Note that shell types end right after the ident, so if we want to implement that.
        // Then we must add a check.
        this.expected(lexer_types_1.TokenIdentifiers.AS, "AS");
        const generateProcTypeObj = (t) => {
            return {
                kind: "PROCEDURE",
                procedure: "CREATE",
                defining: "TYPE",
                definition: t
            };
        };
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.ENUM:
                return generateProcTypeObj(this.parseEnumType(typeIdent));
            case lexer_types_1.TokenIdentifiers.RANGE:
                break;
            // object type entry
            case lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS:
                return generateProcTypeObj(this.parseObjectType(typeIdent));
            default:
                throw new errors_1.SyntaxError("Unexpected Kind of Type!", this.peek().info);
        }
        ;
    }
    ;
    parseCreate() {
        this.eat();
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.TABLE:
                return {
                    kind: "PROCEDURE",
                    procedure: "CREATE",
                    defining: "TABLE",
                    definition: this.parseTable()
                };
            case lexer_types_1.TokenIdentifiers.TYPE:
                return this.parseType();
            case lexer_types_1.TokenIdentifiers.EXTENSION:
                this.eat();
                const ident = this.expected(lexer_types_1.TokenIdentifiers.IDENT, "Extension Identifier");
                this.expected(lexer_types_1.TokenIdentifiers.SEMICOLON, ";");
                return {
                    kind: "PROCEDURE",
                    procedure: "CREATE",
                    defining: "EXTENSION",
                    definition: ident.lexeme
                };
            default:
                throw new errors_1.SyntaxError(`Unexpected value after "CREATE" at "${this.peek().lexeme}"`, this.peek().info);
        }
        ;
    }
    ;
    parse() {
        switch (this.peek().id) {
            case lexer_types_1.TokenIdentifiers.CREATE:
                return this.parseCreate();
            default:
                return this.parseExpr();
        }
        ;
    }
    ;
    generateAST() {
        const root = {
            kind: "ROOT",
            body: []
        };
        try {
            while (this.tokens.length > 0) {
                root.body.push(this.parse());
            }
            ;
            return root;
        }
        catch (e) {
            if (e instanceof errors_1.SyntaxError) {
                console.error(e.stack);
            }
            ;
            process.exit(1);
        }
        ;
    }
    ;
}
;
exports.default = Parser;
