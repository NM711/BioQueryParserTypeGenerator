import type { LineInfo } from "../../types/lexer.types";

export class SyntaxError extends Error {
  constructor (message: string, info: LineInfo) {
    super(` >>>>>> ${message} (col: ${info.col}, row: ${info.row})`);
  };
};
