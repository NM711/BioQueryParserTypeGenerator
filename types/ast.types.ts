interface DefaultConstraint {
  name: "DEFAULT";
  value: LiteralNode;
};

type Constraint = { name: string } | DefaultConstraint;

export interface TableColumnNode {
  type: string;
  constraints: Constraint[];
};

export interface TableDefinitionNode {
  columns: TableColumnNode[];
};

export interface TypeDefinitionNode {

};

interface LiteralNode {
  kind: "LITERAL";
  type: string;
  value: string;
};

interface CreateProcedureNode {
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

export type ProcedureCallNode = CreateProcedureNode;

export type TreeNode = ProcedureCallNode | LiteralNode;

export interface Root {
  kind: "ROOT";
  body: TreeNode[];
};
