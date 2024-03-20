type DataVariants =  "custom" | "array" | "number_literal" | "string_literal" | "literal" | "none";

export type Type<T> = T;

export interface DataTypeNode {
  kind: "DataTypeTS";
  type: string;
  variant: DataVariants;
};

export interface InterfaceFieldNode {
  kind: "InterfaceFieldTS"
  ident: string;
  strict: boolean
  typeInfo: DataTypeNode;
};


export interface InterfaceNode {
  kind: "InterfaceTS";  
  ident: string;
  fields: InterfaceFieldNode[];
};

export interface ImportNode {
  kind: "ImportTS";
  ident: string;
  from: string;
};

export interface TypeNode {
  kind: "TypeTS";
  ident: string;
  values: DataTypeNode[];
};

export type TransformNode = ImportNode | DataTypeNode | TypeNode | InterfaceNode | InterfaceFieldNode;

export interface TransformRoot {
  kind: "RootTS";
  body: TransformNode[];
};
