import { SyntaxError } from "../errors/errors";
import { TokenIdentifiers, Token } from "../../types/lexer.types";
import type { Constraint, IdentifierNode, LiteralNode, Root, TableColumnNode, TableDefinitionNode, TreeNode } from "../../types/ast.types";

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

      default: {
        throw new SyntaxError(`Unexpected attribute or constraint found in "${this.peek().lexeme}"`, this.peek().info);
      };
    };
  };

  private parseColumns(): TableColumnNode[] {
    const columns: TableColumnNode[] = [];

    while (this.peek().id !== TokenIdentifiers.RIGHT_PARENTHESIS) {
      const colIdent = this.expected(TokenIdentifiers.IDENT, "Identifier");

      // expect col type, note this can be a custom type not necessarily only primitive

      const colType = this.peek();
      this.eat();
      
      const column: TableColumnNode = {
        kind: "COLUMN",
        name: colIdent.lexeme,
        type: colType.lexeme,
        constraints: []
      };

      while (this.peek().id !== TokenIdentifiers.RIGHT_PARENTHESIS && this.peek().id !== TokenIdentifiers.SEPERATOR) {
        column.constraints.push(this.parseColumnConstraints());
      };
    };

    return columns;
  };

  /**
   * Parses table in schema file/files
   */

  private parseTable(): TableDefinitionNode {
    this.eat();
    const ident = this.expected(TokenIdentifiers.IDENT, "Identifier");
    this.expected(TokenIdentifiers.LEFT_PARENTHESIS, "(");

    const columns = this.parseColumns();

    this.expected(TokenIdentifiers.RIGHT_PARENTHESIS, ")");
    this.expected(TokenIdentifiers.SEMICOLON, ";");

    return {
      name: ident.lexeme,
      columns
    };
  };

 /**
  * Parses types in schema file (note: custom object types only work for postgresql) 
  */

  private parseType(): TreeNode {
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
    }
    

    console.log(this.tokens)

    try {
      while (this.tokens.length > 0) {
        root.body.push(this.parse())
      };
    } catch (e) {
      console.log(root.body);

      if (e instanceof SyntaxError) {
        console.error(e.message);
        console.error(e.stack)
      };

      process.exit(1);
    };
  };
};

export default Parser;
