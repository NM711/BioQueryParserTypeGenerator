import fs from "node:fs";
import type { InterfaceNode, TransformNode, TransformRoot, TypeNode } from "../../types/transformer.ast.types"

/**
  Reads the Typescript AST then, outputs valid typescript files with the Schemas structure in type format.
**/

type s = 
  string |
  number 

class Compiler {
  private root: TransformRoot;
  private outputString: string;
  
  public set setRoot(root: TransformRoot) {
    this.root = root;
    this.outputString = "";
  };


  private compileInterface(type: InterfaceNode) {
    this.outputString += `export interface ${type.ident} {`;
    for (const field of type.fields) {
      this.outputString += `\n\t${field.ident}`;

      if (field.strict) {
        this.outputString += "?"
      };

      this.outputString += ": ";

      // Something to notice and to fix here is that, fields can only contain a single type value.
      // Each field should be able to have an "n" amount of type values.
      
      switch (field.typeInfo.variant) {
         case "custom":
         case "none":
          this.outputString += `${field.typeInfo.type};`
         break; 
         
         case "literal":
            // this only works with string at the moment, I need to fix this within the transformer.
           this.outputString += `"${field.typeInfo.type}";`
         break;
         case "array":
          this.outputString += `${field.typeInfo.type}[];`;
         break
      };
    };
     this.outputString += "\n};\n\n";
  };

  private compileType(type: TypeNode): void {
    this.outputString += `export type ${type.ident} =`;

    if (type.values.length > 0) {

      for (let i = 0; i < type.values.length; ++i) {
        const value = type.values[i];
        this.outputString += `\n\t${value.type} `;
        
        if (i !== type.values.length - 1) {
          this.outputString += "|"          
        };
      };

    } else {
      this.outputString += type.values[0].type;
    };

    this.outputString += "\n\n";
  };

  private compile(node: TransformNode): void {
    switch (node.kind) {
      case "InterfaceTS":
        this.compileInterface(node);
      break;

      case "TypeTS":
        this.compileType(node);
      break;

      default:
      throw new Error("Unexpected node!");
    };
  };

  public execute(): void {
    for (const node of this.root.body) {
      this.compile(node);
    };


    console.log("Successfully Compiled!");
    fs.writeFileSync("schema.types.ts", this.outputString);
    this.outputString = "";
  };
};

export default Compiler;
