"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LexerTypes;
(function (LexerTypes) {
    let TSTypes;
    (function (TSTypes) {
        TSTypes["NUMBER"] = "number";
        TSTypes["STRING"] = "string";
        TSTypes["DATE"] = "Date";
    })(TSTypes = LexerTypes.TSTypes || (LexerTypes.TSTypes = {}));
    LexerTypes.sqlTypes = {
        "VARCHAR": TSTypes.STRING,
        "TEXT": TSTypes.STRING,
        "UUID": TSTypes.STRING,
        "INTEGER": TSTypes.NUMBER,
        "BIGINT": TSTypes.NUMBER,
        "SMALLINT": TSTypes.NUMBER,
        "SERIAL": TSTypes.NUMBER,
        "TIMESTAMP": `${TSTypes.DATE} | ${TSTypes.STRING}`
    };
    let Keywords;
    (function (Keywords) {
        Keywords["NOT NULL"] = "NOT NULL";
        Keywords["DEFAULT"] = "DEFAULT";
        Keywords["UNIQUE"] = "UNIQUE";
    })(Keywords = LexerTypes.Keywords || (LexerTypes.Keywords = {}));
    let TokenType;
    (function (TokenType) {
        TokenType["CUSTOM_TYPE"] = "CUSTOM_TYPE";
        TokenType["ENUM"] = "ENUM";
        TokenType["RANGE"] = "RANGE";
        TokenType["TABLE"] = "TABLE";
        TokenType["COLUMN"] = "COLUMN";
    })(TokenType = LexerTypes.TokenType || (LexerTypes.TokenType = {}));
})(LexerTypes || (LexerTypes = {}));
exports.default = LexerTypes;
