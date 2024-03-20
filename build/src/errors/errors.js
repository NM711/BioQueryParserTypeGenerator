"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = void 0;
class SyntaxError extends Error {
    constructor(message, info) {
        super(` >>>>>> ${message} (Line: ${info.line}, Char: ${info.char})`);
    }
    ;
}
exports.SyntaxError = SyntaxError;
;
