
import { NeuralNet } from "../src/NeuralNet.mjs";
import {Matrix} from "../src/Matrix.mjs";
import { NeuralNetConfig } from "../src/config/NeuralNetConfig.mjs";
import { Sigmoid } from "../src/activationfunctions/Sigmoid.mjs";
import { TrainingConfig } from "../src/config/TrainingConfig.mjs";
import fs from "fs";
import path from "path";

describe("Testing Neural Net [sajilonet] with various datasets", function() { 
    let dataFolder = "./spec/data";
    const tests = fs.readdirSync(dataFolder, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

    tests.forEach(testDir => {
        //if(testDir.includes('handwriting')) {
        //    return;
        //}
        it(`Testing dataset for ${testDir} `, function(){
            const netConifigJson = JSON.parse(fs.readFileSync(dataFolder + path.sep + 
                testDir + path.sep + "neuralnetconfig.json"));
            const netConfig = new NeuralNetConfig(netConifigJson.layers, 
                getActivationFunction(netConifigJson.activationFunction));
            const trainingConfigJson = JSON.parse(fs.readFileSync(dataFolder + path.sep +
                testDir + path.sep + "trainingconfig.json"))
            const trainingConfig = new TrainingConfig(trainingConfigJson.learningRate, 
                trainingConfigJson.epoch);
            const trainingData = JSON.parse(fs.readFileSync(dataFolder + path.sep + 
                testDir + path.sep + "train.json"));
            const testingData = JSON.parse(fs.readFileSync(dataFolder + path.sep + 
                testDir + path.sep + "test.json"))
    
            let neuralNet = new NeuralNet(netConfig);
            neuralNet.fit(trainingData, trainingConfig);
            
            testingData.forEach(element => {
                let predictedValue = neuralNet.predict(element.X);
                console.info("X: ", element.X, ' Labeled Y: ', element.Y, ' Predicted Y: ',predictedValue);
                expect(doesPredictionMatch(element.Y, predictedValue, 0.5)).toBe(true);
            });
        });   
    });
});


function doesPredictionMatch(a, b, acceptableError){
    let errorMatrix = Matrix.subtract(a, b);
    let errorArray = errorMatrix.toArray();
    errorArray.forEach(element=>{
        if (Math.abs(element) > acceptableError){
            console.warn("Matrices ", a, " and ", b, " are further from acceptable error of ", acceptableError);
            return false;
        }
    })
    return true;
}

function getActivationFunction(functionName){
    if(functionName.toLowerCase() === "sigmoid"){
        return new Sigmoid();
    }
    console.error("No activation function found for ", functionName);
}
