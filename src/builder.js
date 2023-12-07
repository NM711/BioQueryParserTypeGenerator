"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_types_1 = __importDefault(require("../types/lexer.types"));
const utils_1 = require("./utils");
class TypeBuilderTS {
    constructor() {
        this.built = [];
        this.databaseInterfaceFields = [];
        this.sqlTypes = lexer_types_1.default.sqlTypes;
        this.kysleyBuildMode = false;
    }
    /***
     * @method setCustomSqlTypes
     * @param types
     * @type typeof this.sqltypes & object
     * @description
     * Provided method that allows for me to add the this.sqlTypes object, that was updated within the Lexer object for
     * use within this TypeBuilderTS Class.
     * */
    set setCustomSqlTypes(types) {
        this.sqlTypes = types;
    }
    /***
     * @method tsTypesBuilder
     * @param { name, value, mode }
     * @type TSBuilderParams
     * @description
     * Private method that allows me to easily switch modes to build specific typescript types. These types can be interfaces,
     * types, etc.
     *
     * @example
     * this.tsTypesBuilder({ name: "RandomTypeName", values: ["Cars", "Motorcycles", "Airplanes"], mode: "TYPE" })
     * OUTPUT EXAMPLE: `\ntype "RandomTypeName" = "Cars" | "Motorcycles" | "Airplanes" \n`
     **/
    tsTypesBuilder({ name, values, mode }) {
        switch (mode) {
            case "INTERFACE": {
                return `\nexport interface ${name} {\n${values}\n}\n`;
            }
            case "TYPE": {
                return `\nexport type ${name} = ${values}\n`;
            }
            default: {
                return "NO VALID MODE PROVIDED!";
            }
        }
    }
    tableInterfaceBuilder(table) {
        let tableInterfaceFields = [];
        for (const column of table.columns) {
            const tsType = this.sqlTypes[column.type];
            if (!tsType)
                throw Error("Something went wrong while looking up the given type!");
            let interfaceField = `  ${column.name}?: ${tsType}`;
            // for the kysley mode, this switch will have a greater role
            switch (true) {
                case column.constraints.has("UNIQUE") || column.constraints.has("NOT NULL"): {
                    interfaceField = interfaceField.replace("?", "");
                }
                case column.constraints.has("DEFAULT"): {
                    if (this.kysleyBuildMode) {
                        interfaceField += ` | Generated<${tsType}>`;
                    }
                }
            }
            tableInterfaceFields.push(interfaceField);
        }
        const tableTypeName = `${(0, utils_1.formatTypeName)(table.name)}Table`;
        const tableInterface = this.tsTypesBuilder({ name: tableTypeName, values: tableInterfaceFields.join("\n"), mode: "INTERFACE" });
        this.built.push(tableInterface);
        // find a way to seperate second upper case with underscore.
        this.databaseInterfaceFields.push(`  ${table.name.toLowerCase()}: ${tableTypeName}`);
    }
    /**
    * @method buildTypes
    * @param tokens
    * @type LexerTypes.Token[]
    * @description
    * Public method that parses all of the tokens built by the lexer, in order to generate valid typescript
    * interfaces and types.
    * */
    buildTypes(tokens) {
        for (const token of tokens) {
            switch (token.token_id) {
                case lexer_types_1.default.TokenType.ENUM: {
                    const literalValues = token.value.join(" | ");
                    // custom types like enums, dont need to be formatted ig
                    const literalType = this.tsTypesBuilder({ name: token.name, values: literalValues, mode: "TYPE" });
                    this.built.push(literalType);
                    break;
                }
                case lexer_types_1.default.TokenType.RANGE: {
                    break;
                }
                case lexer_types_1.default.TokenType.CUSTOM_TYPE: {
                    break;
                }
                case lexer_types_1.default.TokenType.TABLE: {
                    this.tableInterfaceBuilder(token);
                    break;
                }
            }
        }
        // build database interface
        const databaseInterface = this.tsTypesBuilder({ name: "Database", values: this.databaseInterfaceFields.join("\n"), mode: 'INTERFACE' });
        this.built.push(databaseInterface);
    }
    get retrieveBuilt() {
        return this.built;
    }
    set setMode(argMode) {
        if (argMode === "kysley") {
            this.kysleyBuildMode = true;
        }
    }
}
exports.default = TypeBuilderTS;
