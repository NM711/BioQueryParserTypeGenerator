"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = __importDefault(require("./builder"));
const lexer_1 = __importDefault(require("./lexer"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_process_1 = __importDefault(require("node:process"));
class SchemaParser {
    constructor() {
        this.lexer = new lexer_1.default();
        this.builder = new builder_1.default();
    }
    read() {
        const data = node_fs_1.default.readFileSync("./BioQuerySchema.sql", { encoding: "utf-8" });
        return data;
    }
    readCmdFlag() {
        const flags = node_process_1.default.argv.slice(2);
        const mode = flags[0];
        const value = flags[1];
        if (mode && mode === "--mode" || mode === "-m") {
            return value;
        }
        return null;
    }
    write() {
        console.time("Performance");
        const builderMode = this.readCmdFlag();
        const unformatted = this.read();
        const tokens = this.lexer.execute(unformatted);
        const lexerSqlTypes = this.lexer.retrieveSqlTypes;
        if (builderMode) {
            this.builder.setMode = builderMode;
        }
        this.builder.setCustomSqlTypes = lexerSqlTypes;
        this.builder.buildTypes(tokens);
        const builtTypes = this.builder.retrieveBuilt.join(" ");
        node_fs_1.default.writeFile("./database.types.ts", builtTypes, (err) => {
            if (err)
                console.error(err);
        });
        console.timeEnd("Performance");
    }
}
exports.default = SchemaParser;
