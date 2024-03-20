import CommandLineInterface from "../tooling/cli";
import Lexer from "./frontend/lexer";
import Parser from "./frontend/parser";
import Transformer from "./frontend/transformer"
import Compiler from "./compiler/compiler"

class Director {
  private cli: CommandLineInterface;
  private lexer: Lexer;
  private parser: Parser;
  private transformer: Transformer;
  private compiler: Compiler;

  constructor() {
    this.cli = new CommandLineInterface();
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.transformer = new Transformer();
    this.compiler = new Compiler();
  };


  public execute() {
    this.cli.execute();

    this.lexer.setInput = this.cli.retrieveInput;
    this.lexer.tokenize();
    
    this.parser.setTokens = this.lexer.retrieveTokens;

    const firstSourceTree = this.parser.generateAST();
  
    this.transformer.setMode = this.cli.retrieveMode;
    this.transformer.setSource = firstSourceTree;
    const transformedSourceTree = this.transformer.generateAST();
    this.compiler.setRoot = transformedSourceTree;
    this.compiler.setMode = this.cli.retrieveMode;
    this.compiler.execute();
  };
};

export default Director;
