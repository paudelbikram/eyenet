export class NeuralNetConfig{

    static build(layers, activationFunction){
        return new NeuralNetConfig(layers, activationFunction);
    }

    constructor(layers, activationFunction){
        this.layers = layers;
        this.activationFunction = activationFunction;
    }
}