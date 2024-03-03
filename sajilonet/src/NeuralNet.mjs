import { NeuralNetConfig } from "./config/NeuralNetConfig.mjs";
import { TrainingConfig } from "./config/TrainingConfig.mjs";
import { Matrix } from "./Matrix.mjs";

import { BinaryOperation } from "./stat/BinaryOperation.mjs";
import { OperationArgument } from "./stat/OperationArgument.mjs";
import { ArgumentType } from "./stat/ArgumentType.mjs";
import { MatrixOperationType } from "./stat/MatrixOperationType.mjs";
import { UnaryOperation } from "./stat/UnaryOperation.mjs";

export class NeuralNet{

    /**
     * Take NeuralNetConfig and generates NeuralNet.
     * @param {NeuralNetConfig} neuralNetConfig 
     * @throws {Error} if invalid neuralNetConfig is passed in
     */
    constructor(neuralNetConfig){
        if (neuralNetConfig.layers.length < 3){
          console.error("Neural Net needs at least 3 layers [input layer, hidden layer, and output layer]");
          throw new Error("Neural Net needs at least 3 layers [input layer, hidden layer, and output layer]");
        }
        this.inputNodes = neuralNetConfig.layers[0];
        this.outputNodes = neuralNetConfig.layers[neuralNetConfig.layers.length - 1];
        this.activationFunction = neuralNetConfig.activationFunction;
        this.weights = [];
        this.bias = [];
        this.isTrained = false;
    
        for (let i = 0; i < neuralNetConfig.layers.length - 1; i++) {
          let weightForLayer = new Matrix(neuralNetConfig.layers[i + 1], neuralNetConfig.layers[i]);
          weightForLayer.randomize();
          this.weights.push(weightForLayer);
    
          let biasForLayer = new Matrix(neuralNetConfig.layers[i + 1], 1);
          biasForLayer.randomize();
          this.bias.push(biasForLayer);
        }
    }


    deepCopyArrayOfMatrices(original) {
        const copy = [];
        for(let i = 0; i < original.length; i++) {
            copy[i] = original[i].deepCopy();
        }
        return copy;
      }
    

    /**
     * Simply feeds forward input to Neural Net
     * and return the output of final layer
     * @param {Array} X 
     * @returns {Array}
     */
    predict(X, collectStat = false) {
        let predictionStat = [];
        let inputs = Matrix.fromArray(X);
        let layer = inputs;
        for (let i = 0; i < this.weights.length; i++) {
          // dot product with weight
          let initialLayer = layer.deepCopy();
          layer = Matrix.dotProduct(this.weights[i], layer);
          let layerAfterWeight = layer.deepCopy();
          if (collectStat) {
            predictionStat.push(
                new BinaryOperation(
                    new OperationArgument('weight', ArgumentType.MATRIX, this.weights[i].deepCopy()),
                    MatrixOperationType.DOT_PRODUCT,
                    new OperationArgument('X', ArgumentType.MATRIX, initialLayer),
                    new OperationArgument('weight_DOT_PRODUCT_X', ArgumentType.MATRIX, layerAfterWeight),
                    "Calculating Weighted Layer : Matrix Dot Product Between Weight And Input Matrix (X)"
                )
              );
          }
          // add bias to it
          layer.add(this.bias[i]);
          let layerAfterBias = layer.deepCopy();
          if (collectStat) {
            predictionStat.push(
                new BinaryOperation(
                    new OperationArgument('weightedLayer', ArgumentType.MATRIX, layerAfterWeight),
                    MatrixOperationType.ELEMENT_WISE_ADDITION,
                    new OperationArgument('bias', ArgumentType.MATRIX, this.bias[i].deepCopy()),
                    new OperationArgument('layerAfterBias', ArgumentType.MATRIX, layerAfterBias),
                    "Adding Bias To Weighted Layer : Matrix Element Wise Addition Between Weighted Layer And Bias"
                )
              );
          }
          // apply activation function
          layer.map(this.activationFunction.activate);
          if (collectStat){
            predictionStat.push(
                new BinaryOperation(
                    new OperationArgument('activation', ArgumentType.FUNCTION, this.activationFunction.activate.toString()),
                    MatrixOperationType.ELEMENT_WISE_FUNCTION,
                    new OperationArgument('layerAfterBias', ArgumentType.MATRIX, layerAfterBias),
                    new OperationArgument('Y', ArgumentType.MATRIX, layer.deepCopy()),
                    "Calculating Final Output : Activation Function To Each Element of Matrix (Output Of Layer After Adding Bias)"
                )
              );
          }
        }
        // todo just return matrix here instead. 
        if (collectStat){
            return [layer.toArray(), predictionStat];
        } else {
            return layer.toArray();
        }     
    }


    /**
     * Takes an array of Json data and  
     * train them according to trainingConfig
     * @param {Array} data 
     * @param {TrainingConfig} trainingConfig 
     */
    fit(data, trainingConfig, trackingEpoches = new Set()) {
        let statMap = new Map();
        let trackingDataIndices = new Set([0,1,2, data.length - 3, data.length - 2, data.length - 1])
        for (let i = 0; i < trainingConfig.epoch; i++) {
            let weightBeforeEpoch = this.deepCopyArrayOfMatrices(this.weights);
            let biasBeforeEpoch = this.deepCopyArrayOfMatrices(this.bias);
            let trainStat = new Map();
            for(let j = 0; j < data.length; j++){
                let d = data[j];
                let weightBeforeTrain = this.deepCopyArrayOfMatrices(this.weights);
                let biasBeforeTrain = this.deepCopyArrayOfMatrices(this.bias);
                let trainingStat = this.train(d.X, d.Y, trainingConfig.learningRate);
                if(trackingEpoches.has(i) && trackingDataIndices.has(j)){
                    trainStat.set(j, {'weightBefore': weightBeforeTrain, 'biasBefore': biasBeforeTrain, 'feedforward': trainingStat.feedforward,
                    'backpropagation': trainingStat.backpropagation, 'weightAfter': this.deepCopyArrayOfMatrices(this.weights), 'biasAfter': this.deepCopyArrayOfMatrices(this.bias)})
                }
            }
            if(trackingEpoches.has(i)){
                statMap.set(i, {'weightBefore': weightBeforeEpoch, 'biasBefore': biasBeforeEpoch, 'weightAfter': this.deepCopyArrayOfMatrices(this.weights), 
                'biasAfter': this.deepCopyArrayOfMatrices(this.bias),'trainingData': trainStat});
            }
        }
        this.isTrained = true;
        return statMap;
    }

    /**
     * Takes features array and labeled array and learning rate and 
     * pass them through training process
     * Optimization algorithm used is Stochastic Gradient Descent.
     * @param {Array} X 
     * @param {Array} Y 
     * @param {Number} learningRate 
     */
    train(X, Y, learningRate) {
        let feedforward = [];
        let backpropagation = [];
        
        let inputs = Matrix.fromArray(X);
        let layerOutputs = [];
        layerOutputs.push(inputs);

        // feeding forward
        for (let i = 0; i < this.weights.length; i++) {
            let feedforwardStep = [];
            //dot product with layer and weight
            let layerOutput = Matrix.dotProduct(this.weights[i],layerOutputs[layerOutputs.length - 1]);
            let outputAfterWeight = layerOutput.deepCopy();
            feedforwardStep.push(
                new BinaryOperation(
                    new OperationArgument('weight', ArgumentType.MATRIX, this.weights[i].deepCopy()),
                    MatrixOperationType.DOT_PRODUCT,
                    new OperationArgument('X', ArgumentType.MATRIX, layerOutputs[layerOutputs.length - 1].deepCopy()),
                    new OperationArgument('weight_DOT_PRODUCT_X', ArgumentType.MATRIX, outputAfterWeight),
                    "Calculating Weighted Layer : Matrix Dot Product Between Weight And Input Matrix (X)"
                )
            );

            //adding bias
            layerOutput.add(this.bias[i]);
            let outputAfterBias = layerOutput.deepCopy();
            feedforwardStep.push(
                new BinaryOperation(
                    new OperationArgument('weightedInput', ArgumentType.MATRIX, outputAfterWeight),
                    MatrixOperationType.ELEMENT_WISE_ADDITION,
                    new OperationArgument('bias', ArgumentType.MATRIX, this.bias[i].deepCopy()),
                    new OperationArgument('weightedInput_ADD_bias', ArgumentType.MATRIX, outputAfterBias),
                    "Adding Bias To Weighted Layer : Matrix Element Wise Addition Between Weighted Layer And Bias"
                )
            );
            
            //applying activation function
            layerOutput.map(this.activationFunction.activate);
            feedforwardStep.push(
                new BinaryOperation(
                    new OperationArgument('activation', ArgumentType.FUNCTION, this.activationFunction.activate.toString()),
                    MatrixOperationType.ELEMENT_WISE_FUNCTION,
                    new OperationArgument('inputWithBias', ArgumentType.MATRIX, outputAfterBias),
                    new OperationArgument('activatedInput', ArgumentType.MATRIX, layerOutput.deepCopy()),
                    "Calculating Final Output : Activation Function To Each Element of Matrix (Output Of Layer After Adding Bias)"
                )
            );
            feedforward.push([feedforwardStep]);
            //keeping track of layers
            layerOutputs.push(layerOutput);
        }
        
        //output layer
        let output = layerOutputs[layerOutputs.length - 1];
        //target matrix
        let target = Matrix.fromArray(Y);
        //error
        let outputErrors = Matrix.subtract(target, output);
        //error calculation step 
        let errorCalStep = [];
        errorCalStep.push(
            new BinaryOperation(
                new OperationArgument('Y', ArgumentType.MATRIX, target.deepCopy()),
                MatrixOperationType.ELEMENT_WISE_SUBSTRACTION,
                new OperationArgument('calculatedY', ArgumentType.MATRIX, output.deepCopy()),
                new OperationArgument('error', ArgumentType.MATRIX, outputErrors.deepCopy()),
                "Calculating Error : Matrix Element Wise Substraction Between Labeled Output (Y) AND Calculated Output"
            )
        );
        backpropagation.push(errorCalStep);

        //last layer calculation
        let lastLayerCalc = [];
        
        //calculating gradients of output layer using first order derivative of activation function
        let gradients = Matrix.map(output, this.activationFunction.deactivate);
        let gradientCopy = gradients.deepCopy();
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('deactivation', ArgumentType.FUNCTION, this.activationFunction.deactivate.toString()),
                MatrixOperationType.ELEMENT_WISE_FUNCTION,
                new OperationArgument('calculatedY', ArgumentType.MATRIX, output.deepCopy()),
                new OperationArgument('gradient', ArgumentType.MATRIX, gradientCopy),
                "Calculating Gradient Step 1 : Deactivation Function To Each Element of Matrix (Calculated Output)"
            )
        );

        //multiplying gradients with error
        gradients.multiply(outputErrors);
        let gradientAfterMultiplyingWithError = gradients.deepCopy();
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('gradient', ArgumentType.MATRIX, gradientCopy),
                MatrixOperationType.ELEMENT_WISE_MULTIPLICATION,
                new OperationArgument('error', ArgumentType.MATRIX, outputErrors.deepCopy()),
                new OperationArgument('gradient_MULTIPLY_error', ArgumentType.MATRIX, gradientAfterMultiplyingWithError),
                "Calculating Gradient Step 2 : Matrix Element Wise Multiplication Between Result Of Step 1 And Error"
            )
        );

        //multiplying gradients with learning rate
        gradients.multiply(learningRate);
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('gradientAfterError', ArgumentType.MATRIX, gradientAfterMultiplyingWithError),
                MatrixOperationType.SCALAR_MULTIPLICATION,
                new OperationArgument('learningRate', ArgumentType.SCALAR, learningRate),
                new OperationArgument('gradientAfterLearningRate', ArgumentType.MATRIX, gradients.deepCopy()),
                "Calculating Gradient Step 3 (Final Step) : Matrix Scalar Multiplication Between Result of Step 2 And Learning Rate"
            )
        );

        //transpose of last hidden layer
        let weight = Matrix.transpose(layerOutputs[layerOutputs.length - 2]);
        lastLayerCalc.push(
            new UnaryOperation(
                new OperationArgument('outputOfLastHiddenLayer', ArgumentType.MATRIX, layerOutputs[layerOutputs.length - 2].deepCopy()),
                MatrixOperationType.TRANSPOSE,
                new OperationArgument('TRANSPOSE_lastHiddenLayer', ArgumentType.MATRIX, weight.deepCopy()),
                "Calculating Transpose Of Last Hidden Layer : Matrix Transpose Of Output Of Last Hidden Layer"
            )
        );

        //dot product with gradients
        let delta = Matrix.dotProduct(gradients, weight);
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('gradientAfterLearningRate', ArgumentType.MATRIX, gradients.deepCopy()),
                MatrixOperationType.DOT_PRODUCT,
                new OperationArgument('transposeOfLastHiddenLayer', ArgumentType.MATRIX, weight.deepCopy()),
                new OperationArgument('delta', ArgumentType.MATRIX, delta.deepCopy()),
                "Calculating Delta : Matrix Dot Product Between Gradient And Transpose Of Last Hidden Layer"
            )
        );

        // Fixing weights and bias
        let weightBefore = this.weights[this.weights.length -1].deepCopy();
        this.weights[this.weights.length - 1].add(delta);
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('weight', ArgumentType.MATRIX, weightBefore),
                MatrixOperationType.ELEMENT_WISE_ADDITION,
                new OperationArgument('delta', ArgumentType.MATRIX, delta.deepCopy()),
                new OperationArgument('newWeight', ArgumentType.MATRIX, this.weights[this.weights.length - 1].deepCopy()),
                "Calculating New Weight : Matrix Element Wise Addition Between Current Weight And Delta"
            )
        );

        let biasBefore = this.bias[this.bias.length - 1].deepCopy();
        this.bias[this.bias.length - 1].add(gradients);
        lastLayerCalc.push(
            new BinaryOperation(
                new OperationArgument('bias', ArgumentType.MATRIX, biasBefore),
                MatrixOperationType.ELEMENT_WISE_ADDITION,
                new OperationArgument('gradientAfterLearningRate', ArgumentType.MATRIX, gradients.deepCopy()),
                new OperationArgument('newBias', ArgumentType.MATRIX, this.bias[this.bias.length - 1].deepCopy()),
                "Calculating New Bias : Matrix Element Wise Addition Between Current Bias And Gradient"
            )
        );
        backpropagation.push(lastLayerCalc);

        let hiddenError = outputErrors;
        for (let i = this.weights.length - 1; i > 0; i--) {
            let t1 = Matrix.transpose(this.weights[i]);
            let backpropSteps = [];
            backpropSteps.push(
                new UnaryOperation(
                    new OperationArgument('weight', ArgumentType.MATRIX, this.weights[i].deepCopy()),
                    MatrixOperationType.TRANSPOSE,
                    new OperationArgument('transposeOfWeight', ArgumentType.MATRIX, t1.deepCopy()),
                    "Calculating Transpose Of Current Weight : Matrix Transpose Of Current Weight"
                )
            );

            let hiddenErrorCopy = hiddenError.deepCopy();
            hiddenError = Matrix.dotProduct(t1, hiddenError);
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('transposeOfWeight', ArgumentType.MATRIX, t1.deepCopy()),
                    MatrixOperationType.DOT_PRODUCT,
                    new OperationArgument('hiddenError', ArgumentType.MATRIX, hiddenErrorCopy.deepCopy()),
                    new OperationArgument('transposeOfWeight_DOT_hiddenError', ArgumentType.MATRIX, hiddenError.deepCopy()),
                    "Calculating DOT Product : Matrix DOT Product Between Transpose Of Current Weight And Error"
                )
            );

            let hiddenGradient = Matrix.map(layerOutputs[i], this.activationFunction.deactivate);
            let hiddenGradientAfterDeactivateCopy = hiddenGradient.deepCopy();
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('deactivation', ArgumentType.FUNCTION, this.activationFunction.deactivate.toString()),
                    MatrixOperationType.ELEMENT_WISE_FUNCTION,
                    new OperationArgument('layerOutput', ArgumentType.MATRIX, layerOutputs[i].deepCopy()),
                    new OperationArgument('gradient', ArgumentType.MATRIX, hiddenGradient.deepCopy()),
                    "Calculating Gradient Step 1 : Deactivation Function To Each Element of Matrix (Current Output Layer)"
                )
            );

            hiddenGradient.multiply(hiddenError);
            let hiddenGradientAfterMultiplyingWithErrorCopy = hiddenGradient.deepCopy();
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('hiddenGradient', ArgumentType.MATRIX, hiddenGradientAfterDeactivateCopy.deepCopy()),
                    MatrixOperationType.ELEMENT_WISE_MULTIPLICATION,
                    new OperationArgument('hiddenError', ArgumentType.MATRIX, hiddenError.deepCopy()),
                    new OperationArgument('gradientAfterError', ArgumentType.MATRIX, hiddenGradientAfterMultiplyingWithErrorCopy),
                    "Calculating Gradient Step 2 : Matrix Element Wise Multiplication Between Result Of Step 1 And Error"
                )
            );


            hiddenGradient.multiply(learningRate);
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('gradientAfterError', ArgumentType.MATRIX, hiddenGradientAfterMultiplyingWithErrorCopy),
                    MatrixOperationType.SCALAR_MULTIPLICATION,
                    new OperationArgument('learningRate', ArgumentType.SCALAR, learningRate),
                    new OperationArgument('gradientAfterLearningRate', ArgumentType.MATRIX, hiddenGradient.deepCopy()),
                    "Calculating Gradient Step 3 (Final Step) : Matrix Scalar Multiplication Between Result of Step 2 And Learning Rate"
                )
            );

            let transposeOfPreviousLayer = Matrix.transpose(layerOutputs[i - 1]);
            backpropSteps.push(
                new UnaryOperation(
                    new OperationArgument('layerOutput', ArgumentType.MATRIX, layerOutputs[i - 1].deepCopy()),
                    MatrixOperationType.TRANSPOSE,
                    new OperationArgument('transposeOfLayerOutput', ArgumentType.MATRIX, transposeOfPreviousLayer.deepCopy()),
                    "Calculating Transpose Of Last Hidden Layer : Matrix Transpose Of Output Of Last Hidden Layer"
                )
            );

            let deltaOfPreviousLayer = Matrix.dotProduct(hiddenGradient, transposeOfPreviousLayer);
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('hiddenGradient', ArgumentType.MATRIX, hiddenGradient.deepCopy()),
                    MatrixOperationType.DOT_PRODUCT,
                    new OperationArgument('transposeOfLayerOutput', ArgumentType.MATRIX, transposeOfPreviousLayer.deepCopy()),
                    new OperationArgument('delta', ArgumentType.MATRIX, deltaOfPreviousLayer.deepCopy()),
                    "Calculating Delta : Matrix Dot Product Between Gradient And Transpose Of Last Hidden Layer"
                )
            );

            let previousWeight = this.weights[i-1].deepCopy();
            let previousBias = this.bias[i-1].deepCopy();

            this.weights[i - 1].add(deltaOfPreviousLayer);
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('previousWeight', ArgumentType.MATRIX, previousWeight),
                    MatrixOperationType.ELEMENT_WISE_ADDITION,
                    new OperationArgument('delta', ArgumentType.MATRIX, deltaOfPreviousLayer.deepCopy()),
                    new OperationArgument('newWeight', ArgumentType.MATRIX, this.weights[i - 1].deepCopy()),
                    "Calculating New Weight : Matrix Element Wise Addition Between Current Weight And Delta"
                )
            );

            this.bias[i - 1].add(hiddenGradient);
            backpropSteps.push(
                new BinaryOperation(
                    new OperationArgument('previousBias', ArgumentType.MATRIX, previousBias),
                    MatrixOperationType.ELEMENT_WISE_ADDITION,
                    new OperationArgument('hiddenGradient', ArgumentType.MATRIX, hiddenGradient.deepCopy()),
                    new OperationArgument('newBias', ArgumentType.MATRIX, this.bias[i - 1].deepCopy()),
                    "Calculating New Bias : Matrix Element Wise Addition Between Current Bias And Gradient"
                )
            );
            backpropagation.push(backpropSteps);
        }
        return {'feedforward': feedforward, 'backpropagation': backpropagation};
    }
}