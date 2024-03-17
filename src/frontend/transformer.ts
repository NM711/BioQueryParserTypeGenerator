import type { DefaultConstraint, ProcedureCallNode, Root, TableDefinitionNode, TreeNode, TypeDefinitionNode } from "../../types/ast.types";
import type { DataTypeNode, InterfaceFieldNode, TransformNode, TransformRoot } from "../../types/transformer.ast.types";

/**
  Transforms the SQL Schema AST, into an AST that is meant to be walked over and compiled into typescript.
*/

class Transformer {

  private source: Root;
  
   constructor() {};

  public set setSource(source: Root) {
    this.source = source;
  };

  private transformType(t: string): string {

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
    };
  
  };

  private get generateDataTypeNode(): DataTypeNode {
    return {
      kind: "DataTypeTS",
      type: "undefined",
      variant: "none",
    };
  };

  private get generateInterfaceFieldNode(): InterfaceFieldNode {
    return {
      kind: "InterfaceFieldTS",
      ident: "",
      typeInfo: this.generateDataTypeNode,
      strict: false,  
    };
  };

  private transformTypeDeclaration(declaration: TypeDefinitionNode): TransformNode {
    switch (declaration.kind) {
      case "ENUM":

        const dataTypes: DataTypeNode[] = [];

        for (const value of declaration.values) {
          
          const typeInfo = this.generateDataTypeNode;
          
          if (value.kind === "LITERAL") {
            typeInfo.type = value.type;
            typeInfo.variant = "custom";         
          };

          dataTypes.push(typeInfo);
        };

      return {
        kind: "TypeTS",
        ident: declaration.name.name,
        values: dataTypes    
      };
      
      case "RANGE":

      break;

      case "OBJECT_TYPE":

        const objectTypeFields: InterfaceFieldNode[] = [];

        for (const f of declaration.fields) {
          const field: InterfaceFieldNode = this.generateInterfaceFieldNode;
          field.ident = f.name.name;
          field.strict = true;
          field.typeInfo.type = f.type.name;
          objectTypeFields.push(field);
        };
        
      return {
        kind: "InterfaceTS",
        ident: declaration.name.name,
        fields: objectTypeFields,    
      };
    };
  };
  
  private transformTableDeclaration(table: TableDefinitionNode): TransformNode {

    const fields: InterfaceFieldNode[] = [];

    for (const column of table.columns) {
      const field: InterfaceFieldNode = this.generateInterfaceFieldNode;

      field.ident = column.name.name;
      
      if (column.constraints["NOT NULL"] || column.constraints["PRIMARY KEY"]) {
        field.strict = true;
      } else if (column.constraints["DEFAULT"]) {
        const defaulted = column.constraints["DEFAULT"] as DefaultConstraint;

          if (defaulted.value.kind === "LITERAL") {
            field.typeInfo.variant = "literal";
            field.typeInfo.type = defaulted.value.value;
          } else if (defaulted.value.kind === "IDENTIFIER") {
            field.typeInfo.variant = "custom";
            field.typeInfo.type = defaulted.value.name;
          };
        continue;
      };

      field.typeInfo.type = this.transformType(column.type.name);
    
      fields.push(field);
    };

    return {
      kind: "InterfaceTS",
      ident: table.name.name,
      fields
    };
  };

  private transformProcedure(proc: ProcedureCallNode): TransformNode | undefined {
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
      };
    };
  };


  private transform(node: TreeNode): TransformNode | undefined {
    switch (node.kind) {
      case "PROCEDURE":
      return this.transformProcedure(node);

      default:
      throw new Error(`Invalid node kind "${node.kind}" when attempting to transform!`);
    };
  };

  public generateAST(): TransformRoot {
    const transformed: TransformRoot = {
      kind: "RootTS",
      body: [] 
    };

    try {
      for (const node of this.source.body) {

        const result = this.transform(node);

        if (result) {
          transformed.body.push(result);
        };
    };
      
    } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack);

          console.log(transformed);
          process.exit(1);
        };
    };

    // console.log(transformed);
 
    return transformed;
  };
  
};


export default Transformer;
