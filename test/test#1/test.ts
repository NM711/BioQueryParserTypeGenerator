import fs from "node:fs";
import Lexer from "../../src/frontend/lexer";
import Parser from "../../src/frontend/parser";

function main () {
  const data = fs.readFileSync("./test.sql", { encoding: "utf8" });

  const lexer = new Lexer();
  const parser = new Parser();

  lexer.setInput = data;

  lexer.tokenize();

  const token = lexer.retrieveTokens;

  parser.setTokens = token;

  const tree = parser.generateAST();

  console.log(tree);
};

main();
