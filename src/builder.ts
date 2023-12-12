import BuilderTypes from "../types/builder"
import LexerTypes from "../types/lexer.types"
import { formatTypeName } from "./utils"

class TypeBuilderTS {
  private built: string[]
  private sqlTypes: typeof LexerTypes.sqlTypes & Record<string, string>
  private kysleyBuildMode: boolean
  private databaseInterfaceFields: string[]

  constructor () {
    this.built = []
    this.databaseInterfaceFields = []
    this.sqlTypes = LexerTypes.sqlTypes
    this.kysleyBuildMode = false
  }

  /***
   * @method setCustomSqlTypes
   * @param types
   * @type typeof this.sqltypes & object
   * @description
   * Provided method that allows for me to add the this.sqlTypes object, that was updated within the Lexer object for
   * use within this TypeBuilderTS Class.
   * */

  public set setCustomSqlTypes (types: typeof this.sqlTypes & object) {
    this.sqlTypes = types
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
  
  private tsTypesBuilder({ name, values, mode }: BuilderTypes.TSBuilderParams): string {
    switch (mode) {
      case "INTERFACE": {
        return `\nexport interface ${name} {\n${values}\n}\n`;
      };

      case "TYPE": {
        return `\nexport type ${name} = ${values}\n`;
      };

      default: {
        return "NO VALID MODE PROVIDED!";
      };
    };
  };

  private userDefinedObjectTypeInterfaceBuilder (objType: LexerTypes.TypeCustomToken): void {
    const objTypeInterfaceFields: string[] = []
    for (const field of objType.value) {
      const tsType = this.sqlTypes[field.type];
      if (!tsType) throw Error("Something went wrong while looking up the given type!");
      let interfaceField = `  ${field.name}: ${tsType}`;
        
      objTypeInterfaceFields.push(interfaceField);
    };
    
    const objTypeInterface = this.tsTypesBuilder({
      name: objType.name,
      values: objTypeInterfaceFields.join("\n"),
      mode: "INTERFACE"
    });
    this.built.push(objTypeInterface)
  };

  private tableInterfaceBuilder (table: LexerTypes.TableDataToken): void {
    const tableInterfaceFields: string[] = [];
    for (const column of table.columns) {
      const tsType = this.sqlTypes[column.type];
      if (!tsType) throw Error("Something went wrong while looking up the given type!");
      let interfaceField = `  ${column.name}?: ${tsType}`;
      // for the kysley mode, this switch will have a greater role
      switch (true) {
        case column.constraints.has("UNIQUE") || column.constraints.has("NOT NULL"): {
          interfaceField = interfaceField.replace("?", "");
        };

        case column.constraints.has("DEFAULT"): {
          if (this.kysleyBuildMode) {
            interfaceField += ` | Generated<${tsType}>`;
          };
        };
      };

      tableInterfaceFields.push(interfaceField);
    };
    const tableTypeName = `${formatTypeName(table.name)}Table`;
    const tableInterface = this.tsTypesBuilder({ name: tableTypeName, values: tableInterfaceFields.join("\n"), mode: "INTERFACE" });
    this.built.push(tableInterface);

    // find a way to seperate second upper case with underscore.
    this.databaseInterfaceFields.push(`  ${table.name.toLowerCase()}: ${tableTypeName}`);
  };

  /***
  * @method buildTypes 
  * @param tokens
  * @type LexerTypes.Token[]
  * @description
  * Public method that parses all of the tokens built by the lexer, in order to generate valid typescript
  * interfaces and types.
  **/

  public buildTypes (tokens: LexerTypes.Token[]) {
    for (const token of tokens) {

      switch (token.token_id) {
        case LexerTypes.TokenType.ENUM: {
          const literalValues = token.value.join(" | ")
          // custom types like enums, dont need to be formatted ig
          const literalType = this.tsTypesBuilder({ name: token.name, values: literalValues, mode: "TYPE" })

          this.built.push(literalType)
          break
        }

        //case LexerTypes.TokenType.RANGE: {
        //  break
        //}

        case LexerTypes.TokenType.CUSTOM_TYPE: {
          this.userDefinedObjectTypeInterfaceBuilder(token);
          break;
        };

        case LexerTypes.TokenType.TABLE: {
          this.tableInterfaceBuilder(token)
          break
        }
      }
    }

    // build database interface
    const databaseInterface = this.tsTypesBuilder({ name: "Database", values: this.databaseInterfaceFields.join("\n"), mode: 'INTERFACE' })
    this.built.push(databaseInterface)
  }

  public get retrieveBuilt() {
    return this.built
  }

  public set setMode (argMode: string) {
    if (argMode === "kysley") {
      this.kysleyBuildMode = true
    }
  }
}

export default TypeBuilderTS
