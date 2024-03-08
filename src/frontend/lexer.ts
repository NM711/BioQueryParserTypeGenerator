import { SyntaxError } from "../errors/errors";
import { Token, LineInfo, TokenIdentifiers, LexerState, LexerCode } from "../../types/lexer.types";

class Lexer {
  private tokens: Token[];
  private input: string[];
  private lookup: Map<string, TokenIdentifiers>;
  private info: LineInfo;
  private state: LexerState;

  constructor () {
    this.tokens = [];
    this.input = [];
    this.state = {
      code: LexerCode.LEXER_OK,
      value: this.peek()
    };

    this.lookup = new Map();
    this.info = {
      col: 1,
      row: 1
    };

    this.initLookup();
  };

  private initLookup(): void {
    this.lookup.set("CREATE", TokenIdentifiers.CREATE);
    this.lookup.set("TABLE", TokenIdentifiers.TABLE);
    this.lookup.set("TYPE", TokenIdentifiers.TYPE);
    this.lookup.set("DEFAULT", TokenIdentifiers.DEFAULT);
    this.lookup.set("NOT", TokenIdentifiers.NOT);
    this.lookup.set("AS", TokenIdentifiers.AS);
    this.lookup.set("NULL", TokenIdentifiers.NULL);
    this.lookup.set("VARCHAR", TokenIdentifiers.VARCHAR);
    this.lookup.set("TYPE", TokenIdentifiers.TYPE);
    this.lookup.set("TEXT", TokenIdentifiers.TEXT);
    this.lookup.set("INT", TokenIdentifiers.INT);
    this.lookup.set("INTEGER", TokenIdentifiers.INT);
    this.lookup.set("REAL", TokenIdentifiers.REAL);
    this.lookup.set("FLOAT", TokenIdentifiers.FLOAT);
    this.lookup.set("TIMESTAMP", TokenIdentifiers.TIMESTAMP);
    this.lookup.set("ENUM" ,TokenIdentifiers.ENUM)
    this.lookup.set("RANGE", TokenIdentifiers.RANGE);
    this.lookup.set("EXTENSION", TokenIdentifiers.EXTENSION);
    this.lookup.set("TIME", TokenIdentifiers.TIME);
    this.lookup.set("ZONE", TokenIdentifiers.ZONE);
    this.lookup.set("WITH", TokenIdentifiers.WITH);
    this.lookup.set("ALTER", TokenIdentifiers.ALTER);
    this.lookup.set("UNIQUE", TokenIdentifiers.UNIQUE);
    this.lookup.set("PRIMARY", TokenIdentifiers.PRIMARY);
    this.lookup.set("KEY", TokenIdentifiers.KEY);
  };

  private isDigit(v: string): boolean {
    return /[0-9]/.test(v);
  };

  private isAlpha(v: string): boolean {
    return /[a-zA-Z_]/.test(v);
  };

  private isSpecial(v: string): boolean {
    return /[\-\+/\(\);"',=]/.test(v);
  };

  private updateLineInfo(): void {
    ++this.info.col
    if (this.peek() === "\n") {
      ++this.info.row;
      this.info.col = 1;
    };
  };

  private pushToken(id: TokenIdentifiers, lexeme: string = this.peek()): void {
    this.tokens.push({
      id,
      lexeme,
      info: this.info
    });
  };

  private eat(): void {
    this.input.shift();
  };

  private peek(index: number = 0): string {
    return this.input[index];
  };

  public set setInput(data: string) {
    this.input = data.split("");
  };

  private handleComment() {
    this.eat();
    this.eat();

    while (this.peek() !== undefined && this.peek() !== "\n") {
      this.updateLineInfo();
      this.eat();
    };
  };

  private handleString(kind: "SINGLE" | "DOUBLE") {
    const condition = () => kind == "DOUBLE" ? this.peek() !== `"` : this.peek() !== "'";

    let str: string = "";

    this.eat();

    while (this.peek() !== undefined && condition()) {
      this.updateLineInfo();
      str += this.peek();
      this.eat();
    };

    this.eat();

    if (kind == "SINGLE") {
      this.pushToken(TokenIdentifiers.STRING_LITERAL, str);
    } else {
      this.pushToken(TokenIdentifiers.IDENT, str);
    };
  };

  private handleLiteralOrKW() {
    let value: string = "";

    while (this.isDigit(this.peek()) || this.isAlpha(this.peek())) {
      this.updateLineInfo();
      value += this.peek();
      this.eat();
    };

    if (this.lookup.has(value.toUpperCase())) {
      const kwId = this.lookup.get(value.toUpperCase()) as TokenIdentifiers;
      this.pushToken(kwId, value);
    } else if (/^[a-zA-Z]+[_a-zA-Z0-9]*$/.test(value)) {
      this.pushToken(TokenIdentifiers.IDENT, value);
    } else if (/[0-9]+.[0-9]+/.test(value) || /[0-9]/.test(value)) {
      this.pushToken(TokenIdentifiers.NUMBER_LITERAL, value); 
    } else {
      this.state.code = LexerCode.LEXER_UNEXPECTED_ERROR;
      this.state.value = value;
    };
  };

  private handleSpecial() {
    switch (this.peek()) {
      case "-": {
        if (this.peek(1) === "-") {
          this.handleComment();
        } else {
          this.state.code = LexerCode.LEXER_UNEXPECTED_ERROR;
        };
        break;
      };

      case "(": {
        this.pushToken(TokenIdentifiers.LEFT_PARENTHESIS);
        this.eat();
        break;
      };

      case ")": {
        this.pushToken(TokenIdentifiers.RIGHT_PARENTHESIS);
        this.eat();
        break;
      };

      case ";": {
        this.pushToken(TokenIdentifiers.SEMICOLON);
        this.eat();
        break;
      };

      case ",": {
        this.pushToken(TokenIdentifiers.SEPERATOR);
        this.eat();
        break;
      };

      case `"`: {
        this.handleString("DOUBLE");
        break;
      };

      case "'": {
        this.handleString("SINGLE");
        break;
      };

      case "=": {
        this.pushToken(TokenIdentifiers.EQUAL);
        this.eat();
      };
    };
  };

  public tokenize(): void {
    while (this.input.length > 0) {
      this.updateLineInfo();

      if (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
        this.handleLiteralOrKW();
      } else if (this.isSpecial(this.peek())) {
        this.handleSpecial();
      } else if (this.peek() === "\n" || this.peek() === " " || this.peek() === "") {
        this.eat();
      } else {
        throw new SyntaxError(`Invalid input at "${this.peek()}"`, this.info);
      };

      if (this.state.code === LexerCode.LEXER_UNEXPECTED_ERROR) {
        throw new SyntaxError(`Unexpected at "${this.state.value}"`, this.info);
      };
    };
  };

  public get retrieveTokens(): Token[] {
    return this.tokens;
  };
};

export default Lexer;
