export class ArgumentType{
    static SCALAR = new ArgumentType("SCALAR");
    static MATRIX = new ArgumentType("MATRIX");
    static FUNCTION = new ArgumentType("FUNCTION");
    
    constructor(name) {
        this.name = name
    }
}