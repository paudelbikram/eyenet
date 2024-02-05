import { ActivationFunction } from "./ActivationFunction.mjs";

// This is not really useful but it is here for reference
export  class ReLu extends ActivationFunction{

    constructor(){
        super("ReLu", 
        x => Math.max(0, x),
        y => y > 0 ? 1 : 0
        );
    }
}