import { ActivationFunction } from "./ActivationFunction.mjs";

// This is not really useful but it is here for reference
export  class Tanh extends ActivationFunction{

    constructor(){
        super("Tanh", 
        x => (Math.exp(x) - Math.exp(-x))/(Math.exp(x) - Math.exp(-x)),
        y => 1 - (a**2)
        );
    }
}