"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
/**
  Reads the Typescript AST then, outputs valid typescript files with the Schemas structure in type format.
**/
class Compiler {
    set setRoot(root) {
        this.root = root;
        this.mode = "DEFAULT";
        this.outputString = "";
    }
    ;
    set setMode(mode) {
        this.mode = mode;
    }
    ;
    compileDataType(info) {
        switch (info.variant) {
            case "custom":
            case "none":
            case "number_literal":
            case "literal":
                return info.type;
            case "string_literal":
                return `"${info.type}"`;
            case "array":
                return `${info.type}[]`;
        }
        ;
    }
    ;
    compileInterface(type) {
        this.outputString += `export interface ${type.ident} {`;
        for (const field of type.fields) {
            this.outputString += `\n\t${field.ident}`;
            if (!field.strict) {
                this.outputString += "?";
            }
            ;
            this.outputString += ": ";
            // Something to notice and to fix here is that, fields can only contain a single type value.
            // Each field should be able to have an "n" amount of type values.
            this.outputString += this.compileDataType(field.typeInfo);
            this.outputString += ";";
        }
        ;
        this.outputString += "\n};\n\n";
    }
    ;
    compileType(type) {
        this.outputString += `export type ${type.ident} =`;
        if (type.values.length > 0) {
            for (let i = 0; i < type.values.length; ++i) {
                const value = type.values[i];
                this.outputString += `\n\t`;
                this.outputString += this.compileDataType(value);
                this.outputString += " ";
                if (i !== type.values.length - 1) {
                    this.outputString += "|";
                }
                ;
            }
            ;
        }
        else {
            this.outputString += type.values[0].type;
        }
        ;
        this.outputString += "\n\n";
    }
    ;
    compile(node) {
        switch (node.kind) {
            case "InterfaceTS":
                this.compileInterface(node);
                break;
            case "TypeTS":
                this.compileType(node);
                break;
            default:
                throw new Error("Unexpected node!");
        }
        ;
    }
    ;
    execute() {
        if (this.mode === "KYSLEY") {
            this.outputString += "import type { Generated } from \"kysley\";\n\n";
        }
        ;
        for (const node of this.root.body) {
            this.compile(node);
        }
        ;
        console.log("Successfully Compiled!");
        node_fs_1.default.writeFileSync("schema.types.ts", this.outputString);
        this.outputString = "";
    }
    ;
}
;
exports.default = Compiler;
