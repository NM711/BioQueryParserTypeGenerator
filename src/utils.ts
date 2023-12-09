import type LexerTypes from "../types/lexer.types"

/**
* @constant schemaRegex
* @description
* Object used for the intialization of schema related Regex.
* The provided regex data is used for parsing the schema and breaking up the relevant parts into smaller, more digestable
* pieces.
* */

export const schemaRegex: LexerTypes.Regex = {
  table: /CREATE TABLE(.*?)\(/g,
  field: /[,\n]/g,
  custom_type: /CREATE TYPE\s/g,
  comment: /--(.*?)\n/g,
}

export function formatTypeName (str: string): string {
  const splitName = str.toLowerCase().trim().split(/[_-]/g);
  let name = "";

  for (const n of splitName) {
    name += n.charAt(0).toUpperCase() + n.slice(1);
  };
  return name;
};

export function fieldSplitFormatter (str: string): string[] {
  const formattedFields = str.replace(/\(\d+\)/g, "").split(schemaRegex.field);
  return formattedFields;
};
