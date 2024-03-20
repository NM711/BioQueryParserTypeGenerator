import fs from "fs";

class CommandLineInterface {
  private mode: "DEFAULT" | "KYSLEY";
  private inputData: string;
  private flags: string[];
  private state: "Read" | "NotRead";
  constructor () {
    this.mode = "DEFAULT";  
    this.inputData = "";  
    this.flags = process.argv.slice(2);
    this.state = "NotRead";
  };

  private handleMode(v: string) {
    switch (v) {
      case "kysley":
        this.mode = "KYSLEY";
      break;

      case "default":
        this.mode = "DEFAULT";
      break;

      default:
        throw new Error("Unexpected value after \"mode\" flag!");
      };
   };

  private eat() {
    return this.flags.shift();
  };

  private expectValue(v: string | undefined) {
    if (!v) {
      throw new Error("Expected a valid value after the command flag!");
    };
  };

  private parseArgs() {

    while (this.flags.length > 0) {
      const fOption = this.eat();
      const fValue = this.eat();

      if (!fOption) {
        break;
      };

      if (fOption === "--mode" || fOption === "-m") {
        this.expectValue(fValue);
        this.handleMode(fValue as string);        
      } else if (fOption === "--path" || fOption === "-p") {
        this.expectValue(fValue);
        this.inputData = fs.readFileSync(fValue as string, "utf-8");      
        this.state = "Read";
      } else {
        throw new Error("Unexpected command line option!");
      };
    };

    if (this.state === "NotRead") {
      throw new Error("No sql file was set to be read from!");
    };
  };

  public execute() {
    this.parseArgs();
  };
  
  public get retrieveMode() {
    return this.mode;
  };

  public get retrieveInput() {
    return this.inputData;
  };
};

export default CommandLineInterface;
