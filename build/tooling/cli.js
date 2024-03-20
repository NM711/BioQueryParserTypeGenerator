"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class CommandLineInterface {
    constructor() {
        this.mode = "DEFAULT";
        this.inputData = "";
        this.flags = process.argv.slice(2);
        this.state = "NotRead";
    }
    ;
    handleMode(v) {
        switch (v) {
            case "kysley":
                this.mode = "KYSLEY";
                break;
            case "default":
                this.mode = "DEFAULT";
                break;
            default:
                throw new Error("Unexpected value after \"mode\" flag!");
        }
        ;
    }
    ;
    eat() {
        return this.flags.shift();
    }
    ;
    expectValue(v) {
        if (!v) {
            throw new Error("Expected a valid value after the command flag!");
        }
        ;
    }
    ;
    parseArgs() {
        while (this.flags.length > 0) {
            const fOption = this.eat();
            const fValue = this.eat();
            if (!fOption) {
                break;
            }
            ;
            if (fOption === "--mode" || fOption === "-m") {
                this.expectValue(fValue);
                this.handleMode(fValue);
            }
            else if (fOption === "--path" || fOption === "-p") {
                this.expectValue(fValue);
                this.inputData = fs_1.default.readFileSync(fValue, "utf-8");
                this.state = "Read";
            }
            else {
                throw new Error("Unexpected command line option!");
            }
            ;
        }
        ;
        if (this.state === "NotRead") {
            throw new Error("No sql file was set to be read from!");
        }
        ;
    }
    ;
    execute() {
        this.parseArgs();
    }
    ;
    get retrieveMode() {
        return this.mode;
    }
    ;
    get retrieveInput() {
        return this.inputData;
    }
    ;
}
;
exports.default = CommandLineInterface;
