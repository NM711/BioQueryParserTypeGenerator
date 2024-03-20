import { SyntaxError } from "../errors/errors";
import { TokenIdentifiers, Token } from "../../types/lexer.types";
import type { Constraint, CreateTypeProcedureNode, EnumDefinitionNode, FieldTypeNode, IdentifierNode, ObjectTypeDefinitionNode, Root, TableColumnNode, TableDefinitionNode, TreeNode, TypeDefinitionNode } from "../../types/ast.types";

class Parser {
  private tokens: Token[];
  constructor () {
    this.tokens = [];
  };

  public set setTokens(tokens: Token[]) {
    this.tokens = tokens;
  };

  private eat(): void {
    this.tokens.shift();
  };

  private peek(index: number = 0): Token {
    return this.tokens[index];
  };

  private expected(id: TokenIdentifiers, lexeme: string): Token {
    if (this.peek().id !== id) {
      throw new SyntaxError(`Expected "${lexeme}" instead received "${this.peek().lexeme}"`, this.peek().info);
    };
    const v = this.peek();
    this.eat();

    return v;
  };

  // # TODO parse function calls

  private parsePrimary(): TreeNode {
    switch (this.peek().id) {
      case TokenIdentifiers.IDENT:
        return {
          kind: "IDENTIFIER",
          name: this.peek().lexeme
        };

      case TokenIdentifiers.NUMBER_LITERAL:
      return  {
        kind: "LITERAL",
        value: this.peek().lexeme,
        type: "NUMBER"
      };

      case TokenIdentifiers.STRING_LITERAL:
      return {
        kind: "LITERAL",
        value: this.peek().lexeme,
        type: "STRING"
      };

      // since default can be set to null.

      case TokenIdentifiers.NULL:
      return {
        kind: "LITERAL",
        value: this.peek().lexeme,
        type: "NULL"  
      };

      default:
        throw new SyntaxError(`Unexpected token at "${this.peek().lexeme}"`, this.peek().info);
    };
  };

  private parseFunctionCall(): TreeNode {
    let lhs = this.parsePrimary();
    this.eat();

    if (this.peek().id === TokenIdentifiers.LEFT_PARENTHESIS) {
      this.eat();

      const functionArguments: TreeNode[] = [];

      while (this.peek() && this.peek().id !== TokenIdentifiers.RIGHT_PARENTHESIS) {
        // parse args if there is any
        functionArguments.push(this.parsePrimary());
        this.eat();
      };

      this.expected(TokenIdentifiers.RIGHT_PARENTHESIS, ")");
      this.expected(TokenIdentifiers.SEMICOLON, ";");

      lhs = {
        kind: "FUNCTION_CALL",
        called: lhs,
        arguments: functionArguments
      }
    };

    return lhs;
  };

  private parseExpr(): TreeNode {
    return this.parseFunctionCall();
  };

  private parseColumnConstraints(): Constraint {
    switch (this.peek().id) {
      case TokenIdentifiers.DEFAULT: {
        this.eat();

        const defaultedValue = this.parsePrimary();
        this.eat();

        if (defaultedValue.kind === "IDENTIFIER" && this.peek().id === TokenIdentifiers.LEFT_PARENTHESIS && this.peek(1).id === TokenIdentifiers.RIGHT_PARENTHESIS) {
          this.eat();
          this.eat();
        };

        return {
          name: "DEFAULT",
          value: defaultedValue
        };
      };

      case TokenIdentifiers.NOT: {
        this.eat();

        this.expected(TokenIdentifiers.NULL, "NULL");

        return {
          name: "NOT NULL"
        };
      };

      case TokenIdentifiers.PRIMARY: {
        this.eat();

        this.expected(TokenIdentifiers.KEY, "KEY");

        return {
          name: "PRIMARY KEY"
        };
      };

      case TokenIdentifiers.UNIQUE: {
        this.eat();
        return {
          name: "UNIQUE"
        };
      };

      case TokenIdentifiers.WITH: {
        this.eat();
        return {
          name: "WITH"
        };
      };

      case TokenIdentifiers.ZONE: {
        this.eat();
        return {
          name: "ZONE"
        };
      };

      case TokenIdentifiers.TIME: {
        this.eat();
        return {
          name: "TIME"
        };
      };

      case TokenIdentifiers.ON: {
        this.eat();

        if (this.peek().lexeme == "DELETE" || this.peek().lexeme == "UPDATE") {
          const action = this.peek().lexeme;

          this.eat();

          this.expected(TokenIdentifiers.CASCADE, "Cascade");

          return {
            name: "ACTION",
            action,
            event: "CASCADE"
          };
        } else {
          throw new SyntaxError("Expected a valid action or constraint!", this.peek().info); 
        };
      };

      // implement one for foreign keys as well.

      case TokenIdentifiers.REFERENCES: {
        this.eat();

        const tableIdent = this.parsePrimary() as IdentifierNode;
        this.expected(TokenIdentifiers.IDENT, "Referenced Table Identifier");

        if (this.peek().id == TokenIdentifiers.LEFT_PARENTHESIS) {
          this.eat();

          const columnIdent = this.parsePrimary() as IdentifierNode;
          this.expected(TokenIdentifiers.IDENT, "Referenced Column Identifier");
          this.expected(TokenIdentifiers.RIGHT_PARENTHESIS, ")");
        
          return {
            name: "REFERENCES",
            refTable: tableIdent,
            refColumn: columnIdent
          };
        };
        
        return {
          name: "REFERENCES",
          refTable: tableIdent,
        };
      };

      default: {
        throw new SyntaxError(`Unexpected attribute or constraint found in "${this.peek().lexeme}"`, this.peek().info);
      };
    };
  };

  private parseColumns(): TableColumnNode[] {
    const columns: TableColumnNode[] = [];

    while (true) {
      const colIdent = this.parsePrimary();
      this.expected(TokenIdentifiers.IDENT, "Identifier");

      // expect col type, note this can be a custom type not necessarily only primitive

      const colType = this.parseFieldType();
      
      const column: TableColumnNode = {
        kind: "COLUMN",
        name: colIdent as IdentifierNode,
        type: colType,
        constraints: []
      };

      while (this.peek().id !== TokenIdentifiers.RIGHT_PARENTHESIS && this.peek().id !== TokenIdentifiers.SEPERATOR) {
        column.constraints.push(this.parseColumnConstraints());
      };
      
      columns.push(column);

      if (this.peek().id === TokenIdentifiers.RIGHT_PARENTHESIS) {
        break;
      } else {
        this.expected(TokenIdentifiers.SEPERATOR, ",");
      };
    };

    return columns;
  };

  /**
   * Parses table in schema file/files
   */

  private parseTable(): TableDefinitionNode {
    this.eat();
    const ident = this.parsePrimary();
    this.expected(TokenIdentifiers.IDENT, "Identifier");
    this.expected(TokenIdentifiers.LEFT_PARENTHESIS, "(");

    const columns = this.parseColumns();

    this.expected(TokenIdentifiers.RIGHT_PARENTHESIS, ")");
    this.expected(TokenIdentifiers.SEMICOLON, ";");

    return {
      name: ident as IdentifierNode,
      columns
    };
  };

  private parseFieldType(): FieldTypeNode {

    const tableColType: FieldTypeNode = {
      kind: "FIELD_TYPE",
      name: this.peek().lexeme
    };
    
    switch (this.peek().id) {
      case TokenIdentifiers.VARCHAR:    
        this.eat();

        this.expected(TokenIdentifiers.LEFT_PARENTHESIS, "(");
        const varcharLiteral = this.parsePrimary();
        this.eat();
        this.expected(TokenIdentifiers.RIGHT_PARENTHESIS, ")");
        tableColType.additionalDetails = [];
        tableColType.additionalDetails.push(varcharLiteral);

      return tableColType;

      case TokenIdentifiers.TEXT:
      case TokenIdentifiers.TIMESTAMP:
      case TokenIdentifiers.TIMESTAMPZ:
      case TokenIdentifiers.DOUBLE:
      case TokenIdentifiers.UUID:
      case TokenIdentifiers.INT:
      case TokenIdentifiers.BOOLEAN:
      case TokenIdentifiers.BYTEA:
      this.eat();        
      return tableColType;

      default:
        // if its an ident we suppose its a custom type, or enum, etc.
        
        this.expected(TokenIdentifiers.IDENT, "Type Identifier");

      return tableColType;
    };
  };

  private parseEnumType(ident: IdentifierNode): EnumDefinitionNode {
    this.eat();
   
    this.expected(TokenIdentifiers.LEFT_PARENTHESIS, "(");


    const values: TreeNode[] = [];

    while (true) {

      values.push(this.parsePrimary());
      this.eat();

      if (this.peek().id === TokenIdentifiers.RIGHT_PARENTHESIS) {
        this.eat();
        break;
      } else {
        this.expected(TokenIdentifiers.SEPERATOR, ",");
      };
      
    };

    this.expected(TokenIdentifiers.SEMICOLON, ";");
    return {
      kind: "ENUM",
      name: ident,
      values
    };
   };

  private parseObjectType(ident: IdentifierNode): ObjectTypeDefinitionNode {
    this.eat();

    const fields: { name: IdentifierNode; type: FieldTypeNode }[] = [];

    while (true) {

      const field = this.parsePrimary() as IdentifierNode;

      this.expected(TokenIdentifiers.IDENT, "Object Field Identifier");

      const fieldType = this.parseFieldType();

      fields.push({
        name: field,
        type: fieldType
      });

      if (this.peek().id === TokenIdentifiers.RIGHT_PARENTHESIS) {
        this.eat();
        break;
      } else {
        this.expected(TokenIdentifiers.SEPERATOR, ",");
      };
    };

    this.expected(TokenIdentifiers.SEMICOLON, ";");

    return {
      kind: "OBJECT_TYPE",
      name: ident,
      fields
    };
  };

  
  /**
   * Parses types in schema file (note: custom object types only work for postgresql) 
   */

  private parseType(): TreeNode {
    this.eat();

    const typeIdent = this.parsePrimary() as IdentifierNode;
    this.expected(TokenIdentifiers.IDENT, "Type Identifier");

    // Note that shell types end right after the ident, so if we want to implement that.
    // Then we must add a check.
    
    this.expected(TokenIdentifiers.AS, "AS");
    
    const generateProcTypeObj = (t: TypeDefinitionNode): CreateTypeProcedureNode => {
      return {
        kind: "PROCEDURE",
        procedure: "CREATE",
        defining: "TYPE",
        definition: t
      };
    }  

    switch (this.peek().id) {
      case TokenIdentifiers.ENUM:
      return generateProcTypeObj(this.parseEnumType(typeIdent));
      
      case TokenIdentifiers.RANGE:

      break;


      // object type entry
      case TokenIdentifiers.LEFT_PARENTHESIS:
      return generateProcTypeObj(this.parseObjectType(typeIdent));

      default:
      throw new SyntaxError("Unexpected Kind of Type!", this.peek().info); 
    };
  };

  
  private parseCreate(): TreeNode {
    this.eat();
    switch (this.peek().id) {
      case TokenIdentifiers.TABLE:
        return {
          kind: "PROCEDURE",
          procedure: "CREATE",
          defining: "TABLE",
          definition: this.parseTable()
        };
      case TokenIdentifiers.TYPE:
        return this.parseType();

      case TokenIdentifiers.EXTENSION:

        this.eat();
        const ident = this.expected(TokenIdentifiers.IDENT, "Extension Identifier");
        this.expected(TokenIdentifiers.SEMICOLON, ";");
        return {
          kind: "PROCEDURE",
          procedure: "CREATE",
          defining: "EXTENSION",
          definition: ident.lexeme
        };
      default:
        throw new SyntaxError(`Unexpected value after "CREATE" at "${this.peek().lexeme}"`, this.peek().info);
    };
  };

  private parse(): TreeNode {
    switch (this.peek().id) {
      case TokenIdentifiers.CREATE:
        return this.parseCreate();
      default:
        return this.parseExpr();
    };
  };

  public generateAST() {

    const root: Root = {
      kind: "ROOT",
      body: []
    };

    try {
      while (this.tokens.length > 0) {
        root.body.push(this.parse())
      };

      return root;
    } catch (e) {

      if (e instanceof SyntaxError) {
       console.error(e.stack)
      };

      process.exit(1);
    };
  };
};

export default Parser;
