import fs from "node:fs";
import Lexer from "../../src/frontend/lexer";
import Parser from "../../src/frontend/parser";
import Transformer from "../../src/frontend/transformer";
import Compiler from "../../src/compiler/compiler";

function main () {
  const data = fs.readFileSync("./test.sql", { encoding: "utf8" });

  const lexer = new Lexer();
  const parser = new Parser();
  const transformer = new Transformer();
  const compiler = new Compiler();
  lexer.setInput = data;

  lexer.tokenize();

  const token = lexer.retrieveTokens;

  parser.setTokens = token;

  transformer.setSource = parser.generateAST();

  compiler.setRoot = transformer.generateAST();

  compiler.execute();
};

main();
