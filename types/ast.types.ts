export interface DefaultConstraint {
  name: "DEFAULT";
  value: TreeNode;
};

interface ReferenceConstraint {
  name: "REFERENCES";
  refTable: IdentifierNode;
  refColumn?: IdentifierNode;
};

interface ActionConstraint {
  name: "ACTION";
  action: string;
  event: string;
};

export type Constraint = { name: string } | ActionConstraint | ReferenceConstraint | DefaultConstraint;

export interface FieldTypeNode {
  kind: "FIELD_TYPE";
  name: string;
  additionalDetails?: TreeNode[];
};

export interface TableColumnNode {
  kind: "COLUMN";
  name: IdentifierNode;
  type: FieldTypeNode;
  constraints: Constraint[];
};

export interface TableDefinitionNode {
  name: IdentifierNode;
  columns: TableColumnNode[];
};

export interface EnumDefinitionNode {
  kind: "ENUM";
  name: IdentifierNode;
  values: TreeNode[];
};

export interface RangeDefinitionNode {
  kind: "RANGE";
};

export interface ObjectTypeDefinitionNode {
  kind: "OBJECT_TYPE";
  name: IdentifierNode;
  fields: {name: IdentifierNode; type: FieldTypeNode}[];
};

export type TypeDefinitionNode = EnumDefinitionNode | RangeDefinitionNode | ObjectTypeDefinitionNode; 

export interface FunctionCallNode {
  kind: "FUNCTION_CALL"
  called: TreeNode;
  arguments: TreeNode[];
};

export interface LiteralNode {
  kind: "LITERAL";
  type: string;
  value: string;
};

export interface IdentifierNode {
  kind: "IDENTIFIER";
  name: string;
};

interface CreateProcedureNode {
  kind: "PROCEDURE",
  procedure: "CREATE",
};

export interface CreateTableProcedureNode extends CreateProcedureNode {
  defining: "TABLE";
  definition: TableDefinitionNode
};

export interface CreateTypeProcedureNode extends CreateProcedureNode {
 defining: "TYPE";
 definition: TypeDefinitionNode;
};

export interface CreateExtensionProcedureNode extends CreateProcedureNode {
  defining: "EXTENSION";
  definition: string;
};

export type ProcedureCallNode = CreateExtensionProcedureNode | CreateTableProcedureNode | CreateTypeProcedureNode;

export type TreeNode = ProcedureCallNode | LiteralNode | IdentifierNode | FunctionCallNode;

export interface Root {
  kind: "ROOT";
  body: TreeNode[];
};
