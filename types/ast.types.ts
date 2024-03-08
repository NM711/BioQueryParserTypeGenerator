interface DefaultConstraint {
  name: "DEFAULT";
  value: TreeNode;
};

export type Constraint = { name: string } | DefaultConstraint;

export interface TableColumnNode {
  kind: "COLUMN";
  name: string;
  type: string;
  constraints: Constraint[];
};

export interface TableDefinitionNode {
  name: string;
  columns: TableColumnNode[];
};

export interface TypeDefinitionNode {

};

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
