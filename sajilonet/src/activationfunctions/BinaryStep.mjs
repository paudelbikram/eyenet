import { ActivationFunction } from "./ActivationFunction.mjs";

// This is not really useful but it is here for reference
export  class BinaryStep extends ActivationFunction{

    constructor(){
        super("BinaryStep", 
        x => x >= 0 ? 1 : 0,
        y => 0 //always 0 for any y
        );
    }
}