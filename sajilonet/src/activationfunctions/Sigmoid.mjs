import { ActivationFunction } from "./ActivationFunction.mjs";

export class Sigmoid extends ActivationFunction{

    constructor(){
        super("Sigmoid", 
        x => 1 / (1 + Math.exp(-x)),
        y => y * (1 - y)
        );
    }
}