import fs from "node:fs";
import Lexer from "../../src/frontend/lexer";

function main () {
  const data = fs.readFileSync("./test.sql", { encoding: "utf8" });

  const lexer = new Lexer();

  console.log(data.split(""))

  lexer.setInput = data;

  lexer.tokenize();

  const token = lexer.retrieveTokens;

  console.log(token)
};

main();
