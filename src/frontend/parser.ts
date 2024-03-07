import type { Root, TreeNode } from "../../types/ast.types";
import { TokenIdentifiers, Token } from "../../types/lexer.types";

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

  private parsePrimary(): TreeNode {
    switch (this.peek().id) {
      case TokenIdentifiers.NUMBER_LITERAL:
      return  {
        kind: "LITERAL",
        value: this.peek().lexeme,
        type: "Number"
      };

      case TokenIdentifiers.STRING_LITERAL:
      return {
        kind: "LITERAL",
        value: this.peek().lexeme,
        type: "String"
      };

      default:
        console.error(`Unknown token at "${this.peek().lexeme}"!\n`);
        process.exit(1);
    };
  };

  private parseTable(): TreeNode {

  };

  private parseType(): TreeNode {

  };

  private parseCreate(): TreeNode {
    this.eat();
    switch (this.peek().id) {
      case TokenIdentifiers.TABLE:
        return this.parseTable();
      case TokenIdentifiers.TYPE:
        return this.parseType();
      default:
        console.error("Unknown create!\n");
        process.exit(1);
    };
  };

  private parse(): TreeNode {
    switch (this.peek().id) {
      case TokenIdentifiers.CREATE:
        return this.parseCreate();
      default:
        return this.parsePrimary();
    };
  };

  public generateAST() {

    let root: Root = {
      kind: "ROOT",
      body: []
    }

    while (this.tokens.length > 0) {
      root.body.push(this.parse())
    };

  };
};

export default Parser;
