// double quotes represent idents, whilst single quotes represent string literals.

export enum LexerCode {
 LEXER_OK,
 LEXER_UNEXPECTED_ERROR
};

export interface LexerState {
  code: LexerCode;
  value: string;
};

export enum TokenIdentifiers {
  IDENT,
  STRING_LITERAL,
  NUMBER_LITERAL,
  CREATE,
  TYPE,
  TABLE,
  EXTENSION,
  AS,
  ALTER,
  ENUM,
  RANGE,
  VARCHAR,
  FLOAT,
  TEXT,
  TIMESTAMP,
  INT,
  DOUBLE,
  REAL,
  NULL,
  TIME,
  ZONE,
  WITH,
  DEFAULT,
  NOT,
  LEFT_PARENTHESIS,
  RIGHT_PARENTHESIS,
  SEMICOLON,
  SEPERATOR,
  EQUAL
};

export class SyntaxError extends Error {
  constructor (message: string, info: LineInfo) {
    super(` >>>>>> ${message} (col: ${info.col}, row: ${info.row})`);
  };
};

export type LineInfo = {
  col: number;
  row: number;
};

export type Token = {
  id: TokenIdentifiers;
  lexeme: string;
  info: LineInfo;
};
