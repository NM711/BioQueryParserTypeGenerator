"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors/errors");
const lexer_types_1 = require("../../types/lexer.types");
class Lexer {
    constructor() {
        this.tokens = [];
        this.input = [];
        this.state = {
            code: lexer_types_1.LexerCode.LEXER_OK,
            value: this.peek()
        };
        this.lookup = new Map();
        this.info = {
            line: 1,
            char: 1
        };
        this.initLookup();
    }
    ;
    initLookup() {
        this.lookup.set("CREATE", lexer_types_1.TokenIdentifiers.CREATE);
        this.lookup.set("TABLE", lexer_types_1.TokenIdentifiers.TABLE);
        this.lookup.set("TYPE", lexer_types_1.TokenIdentifiers.TYPE);
        this.lookup.set("DEFAULT", lexer_types_1.TokenIdentifiers.DEFAULT);
        this.lookup.set("NOT", lexer_types_1.TokenIdentifiers.NOT);
        this.lookup.set("ON", lexer_types_1.TokenIdentifiers.ON);
        this.lookup.set("DELETE", lexer_types_1.TokenIdentifiers.DELETE);
        this.lookup.set("UPDATE", lexer_types_1.TokenIdentifiers.UPDATE);
        this.lookup.set("CASCADE", lexer_types_1.TokenIdentifiers.CASCADE);
        this.lookup.set("BYTEA", lexer_types_1.TokenIdentifiers.BYTEA);
        this.lookup.set("AS", lexer_types_1.TokenIdentifiers.AS);
        this.lookup.set("NULL", lexer_types_1.TokenIdentifiers.NULL);
        this.lookup.set("VARCHAR", lexer_types_1.TokenIdentifiers.VARCHAR);
        this.lookup.set("TYPE", lexer_types_1.TokenIdentifiers.TYPE);
        this.lookup.set("TEXT", lexer_types_1.TokenIdentifiers.TEXT);
        this.lookup.set("INT", lexer_types_1.TokenIdentifiers.INT);
        this.lookup.set("INTEGER", lexer_types_1.TokenIdentifiers.INT);
        this.lookup.set("BIGINT", lexer_types_1.TokenIdentifiers.INT);
        this.lookup.set("REAL", lexer_types_1.TokenIdentifiers.REAL);
        this.lookup.set("FLOAT", lexer_types_1.TokenIdentifiers.FLOAT);
        this.lookup.set("UUID", lexer_types_1.TokenIdentifiers.UUID);
        this.lookup.set("BOOLEAN", lexer_types_1.TokenIdentifiers.BOOLEAN);
        this.lookup.set("TIMESTAMP", lexer_types_1.TokenIdentifiers.TIMESTAMP);
        this.lookup.set("TIMESTAMPZ", lexer_types_1.TokenIdentifiers.TIMESTAMPZ);
        this.lookup.set("REFERENCES", lexer_types_1.TokenIdentifiers.REFERENCES);
        this.lookup.set("ENUM", lexer_types_1.TokenIdentifiers.ENUM);
        this.lookup.set("RANGE", lexer_types_1.TokenIdentifiers.RANGE);
        this.lookup.set("EXTENSION", lexer_types_1.TokenIdentifiers.EXTENSION);
        this.lookup.set("TIME", lexer_types_1.TokenIdentifiers.TIME);
        this.lookup.set("ZONE", lexer_types_1.TokenIdentifiers.ZONE);
        this.lookup.set("WITH", lexer_types_1.TokenIdentifiers.WITH);
        this.lookup.set("ALTER", lexer_types_1.TokenIdentifiers.ALTER);
        this.lookup.set("UNIQUE", lexer_types_1.TokenIdentifiers.UNIQUE);
        this.lookup.set("PRIMARY", lexer_types_1.TokenIdentifiers.PRIMARY);
        this.lookup.set("KEY", lexer_types_1.TokenIdentifiers.KEY);
    }
    ;
    isDigit(v) {
        return /[0-9]/.test(v);
    }
    ;
    isAlpha(v) {
        return /[a-zA-Z_]/.test(v);
    }
    ;
    isSpecial(v) {
        return /[\-\+/\(\);"',=]/.test(v);
    }
    ;
    updateLineInfo() {
        ++this.info.char;
        if (this.peek() === "\n") {
            ++this.info.line;
            this.info.char = 1;
        }
        ;
    }
    ;
    pushToken(id, lexeme = this.peek()) {
        // just realized, javascript passes objects by reference and not by value. Which makes sense, so I cant just say info: this.info, due to this.info
        // being a reference whose underlying fields will change overtime. If I set it that way, every info field will always be equal to the latest version of
        // this.info, rather than a copy of the value before it was updated into something new.
        this.tokens.push({
            id,
            lexeme,
            info: {
                line: this.info.line,
                char: this.info.char
            }
        });
    }
    ;
    eat() {
        this.input.shift();
    }
    ;
    peek(index = 0) {
        return this.input[index];
    }
    ;
    set setInput(data) {
        this.input = data.split("");
    }
    ;
    handleComment() {
        this.eat();
        this.eat();
        while (this.peek() !== undefined && this.peek() !== "\n") {
            this.updateLineInfo();
            this.eat();
        }
        ;
    }
    ;
    handleString(kind) {
        const condition = () => kind == "DOUBLE" ? this.peek() !== `"` : this.peek() !== "'";
        let str = "";
        this.eat();
        while (this.peek() !== undefined && condition()) {
            this.updateLineInfo();
            str += this.peek();
            this.eat();
        }
        ;
        this.eat();
        if (kind == "SINGLE") {
            this.pushToken(lexer_types_1.TokenIdentifiers.STRING_LITERAL, str);
        }
        else {
            this.pushToken(lexer_types_1.TokenIdentifiers.IDENT, str);
        }
        ;
    }
    ;
    handleLiteralOrKW() {
        let value = "";
        while (this.isDigit(this.peek()) || this.isAlpha(this.peek())) {
            this.updateLineInfo();
            value += this.peek();
            this.eat();
        }
        ;
        if (this.lookup.has(value.toUpperCase())) {
            const kwId = this.lookup.get(value.toUpperCase());
            this.pushToken(kwId, value);
        }
        else if (/^[a-zA-Z]+[_a-zA-Z0-9]*$/.test(value)) {
            this.pushToken(lexer_types_1.TokenIdentifiers.IDENT, value);
        }
        else if (/[0-9]+.[0-9]+/.test(value) || /[0-9]/.test(value)) {
            this.pushToken(lexer_types_1.TokenIdentifiers.NUMBER_LITERAL, value);
        }
        else {
            this.state.code = lexer_types_1.LexerCode.LEXER_UNEXPECTED_ERROR;
            this.state.value = value;
        }
        ;
    }
    ;
    handleSpecial() {
        switch (this.peek()) {
            case "-":
                {
                    if (this.peek(1) === "-") {
                        this.handleComment();
                    }
                    else {
                        this.state.code = lexer_types_1.LexerCode.LEXER_UNEXPECTED_ERROR;
                    }
                    ;
                    break;
                }
                ;
            case "(":
                {
                    this.pushToken(lexer_types_1.TokenIdentifiers.LEFT_PARENTHESIS);
                    this.eat();
                    break;
                }
                ;
            case ")":
                {
                    this.pushToken(lexer_types_1.TokenIdentifiers.RIGHT_PARENTHESIS);
                    this.eat();
                    break;
                }
                ;
            case ";":
                {
                    this.pushToken(lexer_types_1.TokenIdentifiers.SEMICOLON);
                    this.eat();
                    break;
                }
                ;
            case ",":
                {
                    this.pushToken(lexer_types_1.TokenIdentifiers.SEPERATOR);
                    this.eat();
                    break;
                }
                ;
            case `"`:
                {
                    this.handleString("DOUBLE");
                    break;
                }
                ;
            case "'":
                {
                    this.handleString("SINGLE");
                    break;
                }
                ;
            case "=":
                {
                    this.pushToken(lexer_types_1.TokenIdentifiers.EQUAL);
                    this.eat();
                }
                ;
        }
        ;
    }
    ;
    tokenize() {
        while (this.input.length > 0) {
            this.updateLineInfo();
            if (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
                this.handleLiteralOrKW();
            }
            else if (this.isSpecial(this.peek())) {
                this.handleSpecial();
            }
            else if (this.peek() === "\n" || this.peek() === " " || this.peek() === "") {
                this.eat();
            }
            else {
                throw new errors_1.SyntaxError(`Invalid input at "${this.peek()}"`, this.info);
            }
            ;
            if (this.state.code === lexer_types_1.LexerCode.LEXER_UNEXPECTED_ERROR) {
                throw new errors_1.SyntaxError(`Unexpected at "${this.state.value}"`, this.info);
            }
            ;
        }
        ;
    }
    ;
    get retrieveTokens() {
        return this.tokens;
    }
    ;
}
;
exports.default = Lexer;
