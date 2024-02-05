import { ActivationFunction } from "./ActivationFunction.mjs";

// This is not really useful but it is here for reference
export  class Linear extends ActivationFunction{

    constructor(){
        super("Linear", 
        x => x,
        y => 1 //always 1 for any y
        );
    }
}