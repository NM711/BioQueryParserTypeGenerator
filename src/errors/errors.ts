import type { LineInfo } from "../../types/lexer.types";

export class SyntaxError extends Error {
  constructor (message: string, info: LineInfo) {
    super(` >>>>>> ${message} (Line: ${info.line}, Char: ${info.char})`);
  };
};
