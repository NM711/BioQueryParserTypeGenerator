"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = __importDefault(require("../tooling/cli"));
const lexer_1 = __importDefault(require("./frontend/lexer"));
const parser_1 = __importDefault(require("./frontend/parser"));
const transformer_1 = __importDefault(require("./frontend/transformer"));
const compiler_1 = __importDefault(require("./compiler/compiler"));
class Director {
    constructor() {
        this.cli = new cli_1.default();
        this.lexer = new lexer_1.default();
        this.parser = new parser_1.default();
        this.transformer = new transformer_1.default();
        this.compiler = new compiler_1.default();
    }
    ;
    execute() {
        this.cli.execute();
        this.lexer.setInput = this.cli.retrieveInput;
        this.lexer.tokenize();
        this.parser.setTokens = this.lexer.retrieveTokens;
        const firstSourceTree = this.parser.generateAST();
        this.transformer.setMode = this.cli.retrieveMode;
        this.transformer.setSource = firstSourceTree;
        const transformedSourceTree = this.transformer.generateAST();
        this.compiler.setRoot = transformedSourceTree;
        this.compiler.setMode = this.cli.retrieveMode;
        this.compiler.execute();
    }
    ;
}
;
exports.default = Director;
