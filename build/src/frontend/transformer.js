"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
  Transforms the SQL Schema AST, into an AST that is meant to be walked over and compiled into typescript.
*/
class Transformer {
    constructor() { }
    ;
    set setSource(source) {
        this.source = source;
    }
    ;
    set setMode(mode) {
        this.mode = mode;
    }
    ;
    transformType(t) {
        switch (t) {
            case "VARCHAR":
            case "TEXT":
            case "UUID":
                return "string";
            case "INTEGER":
            case "INT":
            case "BIGINT":
            case "SMALLINT":
            case "SERIAL":
            case "REAL":
            case "FLOAT":
                return "number";
            case "NULL":
                return "null";
            case "TIMESTAMP":
            case "TIMESTAMPZ":
                return "Date";
            case "BOOLEAN":
                return "boolean";
            default:
                return t;
        }
        ;
    }
    ;
    get generateDataTypeNode() {
        return {
            kind: "DataTypeTS",
            type: "undefined",
            variant: "none",
        };
    }
    ;
    get generateInterfaceFieldNode() {
        return {
            kind: "InterfaceFieldTS",
            ident: "",
            typeInfo: this.generateDataTypeNode,
            strict: false,
        };
    }
    ;
    processLiteral(literal) {
        const t = this.generateDataTypeNode;
        t.type = literal.value;
        switch (literal.type) {
            case "STRING":
                t.variant = "string_literal";
                break;
            case "NUMBER":
                t.variant = "number_literal";
                break;
            default:
                t.variant = "literal";
        }
        ;
        return t;
    }
    ;
    transformTypeDeclaration(declaration) {
        switch (declaration.kind) {
            case "ENUM":
                const dataTypes = [];
                for (const value of declaration.values) {
                    const typeInfo = this.processLiteral(value);
                    dataTypes.push(typeInfo);
                }
                ;
                return {
                    kind: "TypeTS",
                    ident: declaration.name.name,
                    values: dataTypes
                };
            case "RANGE":
                break;
            case "OBJECT_TYPE":
                const objectTypeFields = [];
                for (const f of declaration.fields) {
                    const field = this.generateInterfaceFieldNode;
                    field.ident = f.name.name;
                    field.strict = true;
                    field.typeInfo.type = this.transformType(f.type.name);
                    objectTypeFields.push(field);
                }
                ;
                return {
                    kind: "InterfaceTS",
                    ident: declaration.name.name,
                    fields: objectTypeFields,
                };
        }
        ;
    }
    ;
    transformTableDeclaration(table) {
        const fields = [];
        for (const column of table.columns) {
            const field = this.generateInterfaceFieldNode;
            field.ident = column.name.name;
            for (const constraint of column.constraints) {
                const strictAttributes = new Set(["NOT NULL", "PRIMARY KEY", "UNIQUE"]);
                if (strictAttributes.has(constraint.name)) {
                    field.strict = true;
                }
                ;
            }
            ;
            const typeName = this.transformType(column.type.name);
            field.typeInfo.type = typeName;
            if (this.mode === "KYSLEY") {
                field.typeInfo.type = `Generated<${typeName}>`;
            }
            ;
            fields.push(field);
        }
        ;
        return {
            kind: "InterfaceTS",
            ident: table.name.name,
            fields
        };
    }
    ;
    transformProcedure(proc) {
        if (proc.procedure === "CREATE") {
            switch (proc.defining) {
                case "TABLE":
                    return this.transformTableDeclaration(proc.definition);
                case "TYPE":
                    return this.transformTypeDeclaration(proc.definition);
                // since we only care about types this procedure def is unecessary
                case "EXTENSION":
                    break;
                default:
                    throw new Error(`Unexpected defining field within "CREATE" procedure node!`);
            }
            ;
        }
        ;
    }
    ;
    transform(node) {
        switch (node.kind) {
            case "PROCEDURE":
                return this.transformProcedure(node);
            default:
                throw new Error(`Invalid node kind "${node.kind}" when attempting to transform!`);
        }
        ;
    }
    ;
    generateAST() {
        const transformed = {
            kind: "RootTS",
            body: []
        };
        try {
            for (const node of this.source.body) {
                const result = this.transform(node);
                if (result) {
                    transformed.body.push(result);
                }
                ;
            }
            ;
        }
        catch (e) {
            if (e instanceof Error) {
                console.log(e.stack);
                process.exit(1);
            }
            ;
        }
        ;
        return transformed;
    }
    ;
}
;
exports.default = Transformer;
