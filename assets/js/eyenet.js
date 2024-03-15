'use strict';

//global here because whole thing depends on neuralnet
let neuralnet = undefined;
let testResult = undefined;
let trainingStat = undefined;
let testingStat = undefined;
let currentTrainingSteps = undefined;
let currentTestingSteps = undefined;

//visualization related 
const dx = 250;
const dy = 90;
const r = 25;


// #region utility functions
let getLayerIdentifierFromIdForWeight = (id) => {
  let splitrray = id.split('-');
  return splitrray[1][0];
}


let populateBias = (biases) => {
  console.log('Bias', biases);
  for(let i = 0; i < biases.length; i++){
      const biasData = biases[i].data;
      for(let j = 0; j < biasData.length; j++){
          let bias = biasData[j];
          const id = `b${i+1}${j}`;
          const biasText = document.getElementById(id);
          biasText.textContent = shortenTheNumber(bias, 3);
      } 
  }
}


let angleBetweenTwoPoint = (x1, y1, x2, y2) => {
  let angleInRadian = Math.atan2(y2 - y1, x2 - x1);
  if (angleInRadian < 0){
      angleInRadian += Math.PI * 2;
  }
  return angleInRadian * ( 180 / Math.PI );
}


let populateWeightByLayer = (weight, layer) => {
  const rows = weight.rows;
  const cols = weight.cols;
  const weightData = weight.data;
  for(let j = 0; j < rows; j++){
      for(let k = 0; k < cols; k++){
          let w = weightData[j][k];
          const id = `w${layer-1}${k}-${layer}${j}`;
          const weightText = document.getElementById(id);
          weightText.textContent = w;
      }
  }
}


let populateBiasByLayer = (bias, layer) => {
  const biasData = bias.data;
  for(let j = 0; j < biasData.length; j++){
      let b = biasData[j];
      const id = `b${layer}${j}`;
      const biasText = document.getElementById(id);
      biasText.textContent = b;
  }
}


let shortenTheNumber = (number, lengthAfterDecimal) => {
  let numberString = number.toString();
  let decimalPosition = numberString.indexOf(".");
  if (decimalPosition == -1) return numberString;
  return numberString.substring(0, decimalPosition + lengthAfterDecimal + 1);
}


let populateOutputLayer = (layerId, layerData) => {
  for(let i = 0; i < layerData.length; i++){
      let layerOutputId = `o${layerId}${i}`;
      let layerOutputTextElement = document.getElementById(layerOutputId);
      layerOutputTextElement.textContent = shortenTheNumber(layerData[i][0], 3);
  }  
}


let populateWeight = (weights) => {
  console.log('Weight', weights);
  for(let i = 0; i < weights.length; i++){
      const weightMatrix = weights[i];
      const rows = weightMatrix.rows;
      const cols = weightMatrix.cols;
      const weightData = weightMatrix.data;
      for(let j = 0; j < rows; j++){
          for(let k = 0; k < cols; k++){
              let weight = weightData[j][k];
              const id = `w${i}${k}-${i+1}${j}`;
              const weightText = document.getElementById(id);
              weightText.textContent = shortenTheNumber(weight, 3);
          }
      }
  } 
}


let getWeightPosition = (a, b, id) => {
  let midPoint = (a + b)/2;
  // id will be in the form nn-nn;
  let splitrray = id.split('-');
  let numberToDivide = splitrray[1];
  const posDeterminer = numberToDivide % 3;
  if (posDeterminer == 0){
      return ((a + midPoint)/2 + midPoint)/2;
  }else if(posDeterminer == 1){
      return midPoint;
  }else{
      return ((midPoint + b)/2 + midPoint)/2;
  }
}


let populateAndHightLightNetwork = (stepNumber, steps) => {
  // if step number is 0 reset all the output nodes, weight and biases 
  let inputLayerData = steps[0].rightOperationArgument.argumentValue.data;
  let outputLayerdData = steps[2].resultingArgument.argumentValue.data;
  populateOutputLayer(stepNumber, inputLayerData);
  populateOutputLayer(stepNumber+1, outputLayerdData);
  let weightTextClassName = `weightText-${stepNumber+1}`;
  let biasTextClassName = `biasText-${stepNumber+1}`;
  let inputLayerClassName = `outputText-${stepNumber}`;
  let outputLayerClassName = `outputText-${stepNumber+1}`;
  [].forEach.call(document.getElementsByClassName(inputLayerClassName), function (el) {el.setAttribute('fill', 'red')});
  [].forEach.call(document.getElementsByClassName(outputLayerClassName), function (el) {el.setAttribute('fill', 'green')});
  [].forEach.call(document.getElementsByClassName(weightTextClassName), function (el) {el.setAttribute('fill', 'blue')});
  [].forEach.call(document.getElementsByClassName(biasTextClassName), function (el) {el.setAttribute('fill', 'blue')});
}


let resetHighLight = (layerLength) => {
  console.log('Layer Length', layerLength);
  for(let stepNumber = 0; stepNumber < layerLength; stepNumber++) {
    [].forEach.call(document.getElementsByClassName(`outputText-${stepNumber}`), function (el) {el.setAttribute('fill', 'black')});
    [].forEach.call(document.getElementsByClassName(`outputText-${stepNumber+1}`), function (el) {el.setAttribute('fill', 'black')});
    [].forEach.call(document.getElementsByClassName(`weightText-${stepNumber+1}`), function (el) {el.setAttribute('fill', 'black')});
    [].forEach.call(document.getElementsByClassName(`biasText-${stepNumber+1}`), function (el) {el.setAttribute('fill', 'black')});
  }
}


let resetOutputLayer = (layerLength) => {
  for(let stepNumber = 0; stepNumber < layerLength + 1; stepNumber++) {
    [].forEach.call(document.getElementsByClassName(`outputText-${stepNumber}`), function (el) {el.textContent = ''});
  }
}


let elementWiseContactenationOfMatrices = (matrixA, matrixB) => {
  let result = new sajilonet.Matrix(matrixA.rows, matrixB.cols);
  for (let i = 0; i < result.rows; i++) {
      for (let j = 0; j < result.cols; j++) {
        result.data[i][j] = `${shortenTheNumber(matrixA.data[i][j], 3)} -> ${shortenTheNumber(matrixB.data[i][j], 3)}`;
      }
  }
  return result;
}


//add proper validation css class to the element
let validateElement = (element) =>{
  element.classList.remove('is-invalid');
  element.classList.add('is-valid');
}


//add proper validation css class to the element
let invalidateElement = (element) =>{
  element.classList.remove('is-valid');
  element.classList.add('is-invalid');
}


let removeAllOptions = (selectElement) => {
  let i, l = selectElement.options.length - 1;
   for(i = l; i >= 0; i--) {
      selectElement.remove(i);
   }
}


// gets activation function by their name
function getAfByName(name){
  if (name === 'binarystep') return new sajilonet.BinaryStep();
  if (name === 'linear') return new sajilonet.Linear();
  if (name === 'sigmoid') return new sajilonet.Sigmoid();
  if (name === 'relu') return new sajilonet.ReLu();
  if (name === 'tanh') return new sajilonet.Tanh();
}


/**
 * Returns an array of at most 9 indices. 
 * If available is less than 10, returns [0...available]
 * If available is equal to or greater than 10, returns [first three, mid three, last three]
 * @param {number} available 
 * @returns {Array} 
 */
let getIndicesToCollectStat = (available) => {
  if (available < 10) {
    return [0,1,2,3,4,5,6,7,8];
  }
  let firstThree = [0,1,2];
  let lastThree = [available - 1, available - 2, available - 3];
  let midNumber = available/2;
  let midThree = [midNumber -1, midNumber, midNumber +1];
  return [...firstThree, ...midThree, ...lastThree];
}


// shows the element
let showElement = (element)=>{
  if (element.classList.contains('d-none')){
    element.classList.remove('d-none');
  }
}


// hides the element
let hideElement = (element)=>{
  if (!element.classList.contains('d-none')){
    element.classList.add('d-none');
  }
}


// runs when activation function is selected
let afSelection = (value) =>{
  let customAf = document.getElementById('customaf');
  if (value == 'custom'){
    showElement(customAf);
  } else {
    hideElement(customAf);
  }
}


// download test result
let downloadTestResult = () => {
  let hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/json,' + encodeURI(JSON.stringify(testResult));
  hiddenElement.target = '_blank';
  hiddenElement.download = 'test-result.json';
  hiddenElement.click();
}


// returns valid training data
let getData = async (inputDataId, fileDataId, forTrain) => {
  let element = document.getElementById(inputDataId);
  let elementFile = document.getElementById(fileDataId);
  let value = element.value;
  if (value == undefined || value.trim() === ''){
    let inputFile = elementFile.files[0];
    if (inputFile === undefined || inputFile.type !== 'application/json'){
      return undefined;
    }
    let fileContent = await readFileContent(inputFile);
    return validateData(fileContent, forTrain);
  } else {
    return validateData(value, forTrain);
  }  
}


// reads training and testing data file
let readFileContent = async(file) => {
  let fileContent = await new Promise((resolve) => {
      let fileReader = new FileReader();
      fileReader.onerror = (e) => resolve(undefined);
      fileReader.onload = (e) => resolve(fileReader.result);
      fileReader.readAsText(file);
  });
  return fileContent;
}


let createArgumentDataView = (argument) => {
  if (argument.argumentType.name === 'MATRIX') {
    return createMatrixDataView(argument.argumentValue);
  } else if (argument.argumentType.name === 'FUNCTION' || argument.argumentType.name === 'SCALAR') {
    return argument.argumentValue;
  } else {
    return 'NO IMPLEMENTED';
  }
}


let createMatrixDataView = (matrix) => {
  let collector = [];
  collector.push('<table class="table table-bordered border-primary">');
  for(let i = 0; i < matrix.rows; i++) {
    collector.push('<tr>');
    for(let j = 0; j < matrix.cols; j++) {
      collector.push(`<td>${shortenTheNumber(matrix.data[i][j], 3)}</td>`)
    }
    collector.push('</tr>');
  }
  collector.push('</table>');
  return collector.join('');
}


let createStepView = (step) => {
  if (step instanceof sajilonet.UnaryOperation) {
    //  align-items-center d-flex flex-row flex-nowrap
    return `<div class="row">${step.description}</div>
            <div class="d-flex flex-row flex-nowrap">
              <div class="row align-items-center d-flex flex-row flex-nowrap">
                <div class="col">{${step.operationType.name}}</div>
                <div class="col">
                  ${createArgumentDataView(step.argument)}
                </div>
                <div class="col">=</div>
                <div class="col">
                  ${createArgumentDataView(step.resultingArgument)}
                </div>
              </div>
            </div>`;
  } else if (step instanceof sajilonet.BinaryOperation) {
    return `<div class="row">${step.description}</div>
            <div class="d-flex flex-row flex-nowrap">
              <div class="row align-items-center d-flex flex-row flex-nowrap">
                <div class="col">
                  ${createArgumentDataView(step.leftOperationArgument)}
                </div>
                <div class="col">{${step.operationType.name}}</div>
                <div class="col">
                  ${createArgumentDataView(step.rightOperationArgument)}
                </div>
                <div class="col">=</div>
                <div class="col">
                  ${createArgumentDataView(step.resultingArgument)}
                </div>
              </div>
            </div>`;
  } else {
    return '';
  }
}


let getNeuralNetLayers = (neuralnet) => {
  let nodeConfig = [];
  let pathConfig = [];
  let maxNodeInALayer = 0;
  for(let i = 0; i < neuralnet.weights.length; i++){
      let cols = neuralnet.weights[i].cols
      if(cols > maxNodeInALayer){
          maxNodeInALayer = cols;
      }
  }
  let middleNodeInLongestLayer = maxNodeInALayer/2;
  for(let i = 0; i < neuralnet.weights.length; i++){
      let rows = neuralnet.weights[i].rows;
      let cols = neuralnet.weights[i].cols
      let middleNodeInK = rows/2;
      let middleNodeInJ = cols/2;
      nodeConfig.push(cols);
      for(let j = 0; j < cols; j++){
          let adjustedYforJ = (j + 1) * dy;
          if (middleNodeInJ < middleNodeInLongestLayer){
              let difference = (middleNodeInLongestLayer - middleNodeInJ)/2;
              adjustedYforJ = ((j + 2) + difference) * dy;
          }
          for(let k = 0; k < rows; k++){ 
              let adjustedYforK = (k + 1) * dy;;
              if (middleNodeInK < middleNodeInLongestLayer){
                  let difference = (middleNodeInLongestLayer - middleNodeInK)/2;
                  adjustedYforK = ((k + 2) + difference) * dy;     
              }
              pathConfig.push(
                  {"x1" : (i + 1) * dx, "y1" : adjustedYforJ, "x2" : (i + 2) * dx, "y2" : adjustedYforK, 
                  "id" : i + '' + j +  '-' + (i+1) + '' + k},
              );
          }
      } 
  }
  nodeConfig.push(neuralnet.weights[neuralnet.weights.length-1].rows);
  return [nodeConfig, pathConfig, maxNodeInALayer];
}
// #endregion


// #region validation functions
// validates training data
let validateTrainingData = async() =>{
  let element = document.getElementById('trainingdata');
  let elementFile = document.getElementById('trainingfile');

  let validatedTrainingData = await getData('trainingdata', 'trainingfile', true);
  if (validatedTrainingData == undefined){
    invalidateElement(element);
    invalidateElement(elementFile);
    return false;
  }
  validateElement(element);
  validateElement(elementFile);
  return true;
}


// validates testing data 
let validateTestingData = async() =>{
  let element = document.getElementById('testingdata');
  let elementFile = document.getElementById('testingfile');

  let validatedTestingData = await getData('testingdata', 'testingfile', false);
  if (validatedTestingData == undefined){
    invalidateElement(element);
    invalidateElement(elementFile);
    return false;
  }
  validateElement(element);
  validateElement(elementFile);
  return true;
}


let validateData = (inputArray, shouldValidateY) =>{
  try{
    let inputDatas = JSON.parse(inputArray);
    for(let i = 0; i < inputDatas.length; i++){
      let xydata = inputDatas[i];
      if ((xydata.X.length != neuralnet.inputNodes) 
          || (shouldValidateY && xydata.Y.length != neuralnet.outputNodes)){
        return undefined;
      }
    }
    return inputDatas;
  }catch(e){
    console.error(e);
  }
  return undefined;
}


// validates number of epoch for training
let validateEpoch = () =>{
  let element = document.getElementById('epoch');
  let value = element.value;
  if (value === undefined || value.trim() === ''){
    invalidateElement(element);
    return false;
  }
  if (isNaN(value) || value <= 0){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


// validates learning rate 
let validateLearingRate = () =>{
  let element = document.getElementById('learningrate');
  let value = element.value;
  if (value === undefined || value.trim() == ''){
    invalidateElement(element);
    return false;
  }
  if (isNaN(value) || value <= 0 || value >= 1){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


/**
 * This takes javascript method code as a string, cleans it
 * and returns it in array. This one poses security risk.
 * BE CAREFUL
 * @param {string} jsCode 
 * @returns {Array}
 */
let validateJsCode = (jsCode)=>{
  let lines = jsCode.split('\n');
  let foundReturnAtIndex = 0;
  for(let i = 0; i < lines.length; i++){
    let line = lines[i];
    if (line !== undefined || line.trim() != ''){
      line = line.trim();
      // removing any line that starts with console
      if (line.startsWith('console')){
        delete lines[i];
      }
      // found end of function
      if (line.startsWith('return')){
        foundReturnAtIndex = i;
        break;
      }
    }else {
      delete line[i];
    }
  }
  if (foundReturnAtIndex === 0){
    return undefined;
  }
  let outputCode = [];
  for(let j = 0; j <= foundReturnAtIndex; j++){
    let outputLine = lines[j];
    if (outputLine !== undefined){
      outputCode.push(outputLine);
    }
  }
  return outputCode;
}


// validates method for activation function
let functionValidation = () => {
  let element = document.getElementById("funcimpl");
  let value = element.value;
  if (value === undefined || value.trim() == ''){
    invalidateElement(element);
    return false;
  }
  let validatedCode = validateJsCode(value);
  if (validatedCode === undefined){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


// validates derivative of activation function
let derivativeFunctionValidation = () => {
  let element = document.getElementById("dfunc");
  let value = element.value;
  if (value == undefined || value.trim() == ''){
    invalidateElement(element);
    return false;
  }
  let validatedCode = validateJsCode(value);
  if (validatedCode === undefined){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


// validates name for custom activation function
let functionNameValidation = () => {
  let element = document.getElementById("name");
  let value = element.value;
  if (value == undefined || value.trim() == ''){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


// validates selection for activation function
let activationFunctionValidation = () =>{
  let element = document.getElementById("af");
  let value = element.value;
  if (value == 'empty'){
    invalidateElement(element);
    return false;
  }
  validateElement(element);
  return true;
}


// validates input for layer
let layerValidation = () => {
  let element = document.getElementById("layers");
  let value = element.value;
  console.log(value); 
  if (value == undefined || value == null || value.trim() == ''){
    invalidateElement(element);
    return false;
  }
  let layers = value.split(',');
  if (layers.length < 3){
    invalidateElement(element);
    return false;
  }

  for(let i = 0; i < layers.length; i++){
    if (isNaN(layers[i])){
      invalidateElement(element);
      return false;
    }
    if (layers[i] < 1){
      invalidateElement(element);
      return false;
    }
  }
  validateElement(element);
  return true;
}
// #endregion


// #region neural net initialization 
// runs when create button is pressed
let createButtonPressed = async (event) =>{
  let createInprogress = document.getElementById('create-inprogress');
  let createFailed = document.getElementById('create-failed');
  let createCompleted = document.getElementById('create-completed');
  hideElement(createInprogress);
  hideElement(createFailed);
  hideElement(createCompleted);
  showElement(createInprogress);
  if (event !== undefined) {
    event.preventDefault();
    event.stopPropagation();
  }
  // breather to show inprogress in page
  await new Promise(r => setTimeout(r, 300));
  let isLayerValid = layerValidation();
  if (!isLayerValid){
    hideElement(createInprogress);
    showElement(createFailed);
    return;
  }
  let isAfValid = activationFunctionValidation();
  if (!isAfValid){
    hideElement(createInprogress);
    showElement(createFailed);
    return;
  }  
  let afValue = document.getElementById("af").value;
  if (afValue === 'custom'){
    let isAfNameValid = functionNameValidation();
    let isFunctionValid = functionValidation();
    let isDerivativeValid = derivativeFunctionValidation();
    let isCustomAfValid = (isAfNameValid && isFunctionValid && isDerivativeValid);
    if (!isCustomAfValid){
      hideElement(createInprogress);
      showElement(createFailed);
      return;
    }
  }
  console.log('Initializing Neural Net.');
  try {
    initNeuralNet();
    hideElement(createInprogress);
    showElement(createCompleted);
    createNeuralNet(neuralnet);
  } catch(e){
    hideElement(createInprogress);
    hideElement(createCompleted);
    showElement(createFailed);
    neuralnet = undefined;
    console.error(e);
  }
}


// initialize the neural net
let initNeuralNet = () =>{
  let layersProvided = document.getElementById("layers").value;
  let cleanLayer = layersProvided.split(',');
  let cleanAf = undefined;
  let afProvided = document.getElementById('af').value;
  if(afProvided !== 'empty' && afProvided !== 'custom'){
    cleanAf = getAfByName(afProvided);
  }
  if (afProvided === 'custom'){
    let afName = document.getElementById('name').value;
    let func = document.getElementById('funcimpl').value;
    let dfunc = document.getElementById('dfunc').value;
    cleanAf = new sajilonet.ActivationFunction(afName, eval(`(x)=>{${func}}`), eval(`(y)=>{${dfunc}}`))
  }
  if (cleanAf !== undefined){
    let netConfig = sajilonet.NeuralNetConfig.build(cleanLayer, cleanAf);
    neuralnet = new sajilonet.NeuralNet(netConfig);
    console.log('Neural Net Initialized.', neuralnet);
  }
}


let createNeuralNet = (neuralnet) => {
  // Create SVG container
  const svg = d3.select("#nnVisualization");
  svg.selectAll("*").remove();
  const [nodeConfig, pathConfig, maxNodeInLayer]= getNeuralNetLayers(neuralnet);
  let circles = [];
  for(let i = 0 ; i < nodeConfig.length; i++) {
      const count = nodeConfig[i];
      const middleNodeInLongestLayer = maxNodeInLayer/2;
      const middleNodeInCurrentLayer = count/2;
      for(let j = 0; j < count; j++) {
          let cy = (j + 1)* dy;
          if (middleNodeInCurrentLayer < middleNodeInLongestLayer){
              let difference = (middleNodeInLongestLayer - middleNodeInCurrentLayer)/2;
              cy = ((j + 2) + difference) * dy;
          }
          circles.push({"cx" : (i + 1) * dx, "cy" : cy, "id" : i + ''+ j});
      }
  }
  svg.attr("width", nodeConfig.length * 280).attr("height", maxNodeInLayer * 110);
  // Add lines from one layer to next
  svg.selectAll("line")
      .data(pathConfig)
      .enter().append("line")
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("id", d => `l${d.id}`)
      .attr("class", d => `weightLine-${getLayerIdentifierFromIdForWeight(d.id)}`)
      .attr("stroke", "gray");
  // Add text over those lines
  svg.selectAll("weights")
      .data(pathConfig)
      .enter().append("text")
      //.text(d => `w${d.id}`)
      .attr("x", d => getWeightPosition(d.x1, d.x2, d.id))
      .attr("y", d => getWeightPosition(d.y1, d.y2, d.id))
      .attr("id", d => `w${d.id}`)
      .attr("class", d => `weightText-${getLayerIdentifierFromIdForWeight(d.id)}`)
      .attr("transform", d => 
      `rotate(${angleBetweenTwoPoint(d.x1, d.y1, d.x2, d.y2)}, ${getWeightPosition(d.x1, d.x2, d.id)} , ${getWeightPosition(d.y1, d.y2, d.id)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "black");
  // Add nodes
  svg.selectAll("nodoes")
      .data(circles)
      .enter().append("circle")
      .attr("r", r)
      .attr("stroke", "black")
      .attr("fill", "white")
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .attr("id", d => `c${d.id}`)
      .attr("class", d => `outputCircle-${d.id[0]}`);
  // Add bias to each node
  svg.selectAll("biases")
      .data(circles)
      .enter().append("text")
      //.text(d => `b${d.id}`)
      .attr("x", d => d.cx)
      .attr("y", d => d.cy - (r + 1))
      .attr("id", d => `b${d.id}`)
      .attr("class", d => `biasText-${d.id[0]}`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "black");
  // Add output to each node
  svg.selectAll("outputs")
      .data(circles)
      .enter().append("text")
      //.text(d => `o${d.id}`)
      .attr("x", d => d.cx)
      .attr("y", d => d.cy)
      .attr("id", d => `o${d.id}`)
      .attr("class", d => `outputText-${d.id[0]}`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "black");   
  // populating bias 
  populateBias(neuralnet.bias);
  // populating weights
  populateWeight(neuralnet.weights);
}
// #endregion


// #region neural net training 
// runs when train button is pressed 
let trainButtonPressed = async(event)=>{
  let trainInprogress = document.getElementById('train-inprogress');
  let trainFailed = document.getElementById('train-failed');
  let trainCompleted = document.getElementById('train-completed');
  hideElement(trainInprogress);
  hideElement(trainFailed);
  hideElement(trainCompleted);
  showElement(trainInprogress);
  if (event !== undefined) {
    event.preventDefault();
    event.stopPropagation();
  }
  // breather to show inprogress in page
  await new Promise(r => setTimeout(r, 300));
  if (neuralnet === undefined){
    console.error('Neural Net has not been initialized yet.');
    hideElement(trainInprogress);
    showElement(trainFailed);
    return;
  }
  let isEpochValid = validateEpoch();
  if (!isEpochValid){
    hideElement(trainInprogress);
    showElement(trainFailed);
    return;
  }
  let isLearningRateValid = validateLearingRate();;
  if (!isLearningRateValid){
    hideElement(trainInprogress);
    showElement(trainFailed);
    return;
  }
  let isTrainingDataValid = await validateTrainingData();
  if (!isTrainingDataValid){
    hideElement(trainInprogress);
    showElement(trainFailed);
    return;
  }
  console.log('Training Neural Net.');
  try {
    await trainNeuralNet();
    hideElement(trainInprogress);
    showElement(trainCompleted);
    populateTraningData(trainingStat);
  } catch(e){
    hideElement(trainInprogress);
    hideElement(trainCompleted);
    showElement(trainFailed);
    console.error(e);
  }
}


// trains neural net with training data and collects stats
let trainNeuralNet = async() =>{
  let learningRate = document.getElementById('learningrate').value;
  let epoch = document.getElementById('epoch').value;

  let trainingConfig = sajilonet.TrainingConfig.build(learningRate, epoch);
  let dataToTrain = await getData('trainingdata', 'trainingfile', true);
  trainingStat = neuralnet.fit(dataToTrain,trainingConfig, new Set(getIndicesToCollectStat(epoch)));
  console.log('Neural Net has been trained. Training Stat: ', trainingStat);
}


let populateTraningData = (trainingStat) => {
  let epochDropDown = document.getElementById("visualEpoch");
  removeAllOptions(epochDropDown);
  for(let key of trainingStat.keys()){
      let option = document.createElement('option');
      option.text = option.value = key;
      epochDropDown.add(option, 0);
  }
  let infoOption = document.createElement('option');
  infoOption.text = 'Select an epoch';
  infoOption.value = 'empty'
  epochDropDown.add(infoOption, 0);
  epochDropDown.value = 'empty';
}


let visualEpochChange = (value) => {
  if (value === "empty") return;
  let visualTraningData = document.getElementById('visualTrainingData');
  removeAllOptions(visualTraningData);
  let trainingDataForEpoch = trainingStat.get(parseInt(value)).trainingData;
  for(let key of trainingDataForEpoch.keys()){
    let option = document.createElement('option');
    option.text = option.value = key;
    visualTraningData.add(option, 0);
  }
  let infoOption = document.createElement('option');
  infoOption.text = 'Select a training data';
  infoOption.value = 'empty'
  visualTraningData.add(infoOption, 0);
  visualTraningData.value = 'empty';
}


let visualTraningDataChange = (value) => {
  let epoch = document.getElementById("visualEpoch").value;
  let trainingSteps = trainingStat.get(parseInt(epoch)).trainingData.get(parseInt(value));
  populateTrainingSteps(trainingSteps);
}


let trainingFeedforwardStepClicked = (step) => {
  console.log('Training Feedforward Stat:', currentTrainingSteps.feedforward);
  console.log('Step', step);
  let steps = currentTrainingSteps.feedforward[step];
  populateTrainingStepDetails(steps[0]);
  console.log('steps', steps);
  console.log('step number', step);
  if (step == 0) {
    console.log('Step is 0');
    populateWeight(currentTrainingSteps.weightBefore);
    populateBias(currentTrainingSteps.biasBefore);
    resetOutputLayer(currentTrainingSteps.feedforward.length);
  }
  resetHighLight(currentTrainingSteps.feedforward.length);
  populateAndHightLightNetwork(step, steps[0]);
}


let trainingBackpropationStepClicked = (step) => {
  console.log('Training backpropagation stat:', currentTrainingSteps.backpropagation);
  console.log('Step', step);
  let steps = currentTrainingSteps.backpropagation[step];
  populateTrainingStepDetails(steps);
  let numberOfLayer = currentTrainingSteps.feedforward.length;
  resetHighLight(numberOfLayer);
  if (step == 0) {
    populateWeight(currentTrainingSteps.weightBefore);
    populateBias(currentTrainingSteps.biasBefore);
  } else {
    let currentBias = steps[steps.length - 1].leftOperationArgument.argumentValue;
    let newBias = steps[steps.length - 1].resultingArgument.argumentValue;
    let currentWeight = steps[steps.length - 2].leftOperationArgument.argumentValue;; 
    let newWeight = steps[steps.length - 2].resultingArgument.argumentValue;
    let outputBias = elementWiseContactenationOfMatrices(currentBias, newBias);
    let outputWeight = elementWiseContactenationOfMatrices(currentWeight, newWeight);
    populateBiasByLayer(outputBias, numberOfLayer - step + 1);
    populateWeightByLayer(outputWeight, numberOfLayer - step + 1);
    [].forEach.call(document.getElementsByClassName(`outputText-${numberOfLayer - step}`), function (el) {el.setAttribute('fill', 'red')});
    [].forEach.call(document.getElementsByClassName(`outputText-${numberOfLayer - step + 1}`), function (el) {el.setAttribute('fill', 'red')});
    [].forEach.call(document.getElementsByClassName(`weightText-${numberOfLayer - step + 1}`), function (el) {el.setAttribute('fill', 'green')});
    [].forEach.call(document.getElementsByClassName(`biasText-${numberOfLayer - step + 1}`), function (el) {el.setAttribute('fill', 'green')});
  }
}


let populateTrainingSteps = (trainingSteps) => {
  console.log(trainingSteps);
  populateWeight(trainingSteps.weightBefore);
  populateBias(trainingSteps.biasBefore);
  currentTrainingSteps = trainingSteps;
  let steps = document.getElementById('trainingStepLink');
  steps.innerHTML = ""
  let innerinnerHTML = []; 
  for(let i = 0; i < currentTrainingSteps.feedforward.length; i++) {
    innerinnerHTML.push(`<input type="radio" class="btn-check" name="btnradio" id="ffbtnradio${i}" autocomplete="off" onclick="trainingFeedforwardStepClicked(${i})">
    <label class="btn btn-outline-secondary" for="ffbtnradio${i}" >ff step ${i}</label>`)
  }
  for(let i = 0; i < currentTrainingSteps.backpropagation.length; i++) {
    innerinnerHTML.push(`<input type="radio" class="btn-check" name="btnradio" id="bpbtnradio${i}" autocomplete="off" onclick="trainingBackpropationStepClicked(${i})">
    <label class="btn btn-outline-secondary" for="bpbtnradio${i}" >bp step ${i}</label>`)
  }
  steps.innerHTML = `<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
  ${innerinnerHTML.join('')}
  </div>
  `
}


let populateTrainingStepDetails = (steps) => {
  let detailsDocument = document.getElementById('trainingStepDetails');
  let detailsHtml = [];
  for(let i = 0; i < steps.length; i++) {
    detailsHtml.push(`<li class="list-group-item">${createStepView(steps[i])}</li>`);
  }
  detailsDocument.innerHTML = `
                              <ol class="list-group list-group-numbered list-group-flush">
                                ${detailsHtml.join('')}
                              </ol>`;
  
}
// #endregion


// #region neural net testing
// runs when test button is pressed 
let testButtonPressed = async(event)=>{
  let testInprogress = document.getElementById('test-inprogress');
  let testFailed = document.getElementById('test-failed');
  let testCompleted = document.getElementById('test-completed');
  let downloadButton = document.getElementById('download-test-result');
  hideElement(testInprogress);
  hideElement(testFailed);
  hideElement(testCompleted);
  hideElement(downloadButton);
  showElement(testInprogress);
  if (event !== undefined) {
    event.preventDefault();
    event.stopPropagation();
  }
  // breather to show inprogress in page
  await new Promise(r => setTimeout(r, 300));
  if (neuralnet === undefined){
    console.error('Neural Net has not been initialized yet.');
    hideElement(testInprogress);
    showElement(testFailed);
    return;
  }
  if (!neuralnet.isTrained){
    console.error('Neural Net has not been trained yet. Please train Neural Net before testing.');
    hideElement(testInprogress);
    showElement(testFailed);
    return;
  }
  let isTestingDataValid = await validateTestingData();
  if (!isTestingDataValid){
    hideElement(testInprogress);
    showElement(testFailed);
    return;
  }
  console.log('Testing Neural Net.');
  try {
    await testNeuralNet();
    hideElement(testInprogress);
    showElement(testCompleted);
    showElement(downloadButton);
    populateTestingData(testingStat)
  } catch(e){
    hideElement(testInprogress);
    hideElement(testCompleted);
    showElement(testFailed);
    console.error(e);
  }
}


// tests the neural net with testing data and collects the stats
let testNeuralNet = async() =>{
  let dataToTest = await getData('testingdata', 'testingfile', false);
  testResult = [];
  testingStat = [];
  let trackingIndices = new Set(getIndicesToCollectStat(dataToTest.length));
  for(let i = 0; i < dataToTest.length; i++){
    let element = {...dataToTest[i]};
    let result = neuralnet.predict(element['X'], true);
    element['PY'] = result[0];
    testResult.push(element);
    if (trackingIndices.has(i)){
      testingStat.push(result[1]);
    }
  }
  console.log('Neural Net has been tested. Testing Stat: ', testingStat);
}


let populateTestingData = (testingStat) => {
  console.log('Populating testing data', testingStat);
  let testindDataDropdown = document.getElementById("visualTestingData");
  removeAllOptions(testindDataDropdown);
  for(let key of testingStat.keys()){
      let option = document.createElement('option');
      option.text = option.value = key;
      testindDataDropdown.add(option, 0);
  }
  let infoOption = document.createElement('option');
  infoOption.text = 'Select a testing data';
  infoOption.value = 'empty'
  testindDataDropdown.add(infoOption, 0);
  testindDataDropdown.value = 'empty';
}


let visualTestingDataChange = (value) => {
  let testingSteps = testingStat[parseInt(value)];
  console.log('Testing Steps: ', testingSteps);
  populateTestingSteps(testingSteps);
}


let populateTestingSteps = (testingStep) => {
  console.log('Testing Step Data: ', testingStep);
  // neural net is already trained. So, its current weight and bias are modified
  populateWeight(neuralnet.weights);
  populateBias(neuralnet.bias);
  currentTestingSteps = testingStep;
  let steps = document.getElementById('testingStepLink');
  steps.innerHTML = ""
  let innerinnerHTML = []; 
  for(let i = 0; i < currentTestingSteps.length; i++) {
    innerinnerHTML.push(`<input type="radio" class="btn-check" name="btnradio" id="testingffbtnradio${i}" autocomplete="off" onclick="testingFeedforwardStepClicked(${i})">
    <label class="btn btn-outline-secondary" for="testingffbtnradio${i}" >ff step ${i}</label>`)
  }
  steps.innerHTML = `<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
  ${innerinnerHTML.join('')}
  </div>
  `
}


let testingFeedforwardStepClicked = (step) => {
  console.log('Testing Feedforward Stat:', currentTestingSteps);
  console.log('Step', step);
  let steps = currentTestingSteps[step];
  populateTestingStepDetails(steps);
  console.log('steps', steps);
  console.log('step number', step);
  if (step == 0) {
    console.log('Step is 0');
    populateWeight(neuralnet.weights);
    populateBias(neuralnet.bias);
    resetOutputLayer(currentTestingSteps.length);
  }
  resetHighLight(currentTestingSteps.length);
  populateAndHightLightNetwork(step, steps);
}


let populateTestingStepDetails = (steps) => {
  let detailsDocument = document.getElementById('testingStepDetails');
  let detailsHtml = [];
  for(let i = 0; i < steps.length; i++) {
    detailsHtml.push(`<li class="list-group-item">${createStepView(steps[i])}</li>`);
  }
  detailsDocument.innerHTML = `
                              <ol class="list-group list-group-numbered list-group-flush">
                                ${detailsHtml.join('')}
                              </ol>`;
}
// #endregion

let trainVisClicked = () => {
  let testConfig = document.getElementById('test-vis');
  hideElement(testConfig);
  let trainConfig = document.getElementById('train-vis');
  showElement(trainConfig);
}

let testVisClicked = () => {
  let trainConfig = document.getElementById('train-vis');
  hideElement(trainConfig);
  let testConfig = document.getElementById('test-vis');
  showElement(testConfig);
}

let xorDataSelected = async() => {
  document.getElementById("layers").value = "2,5,3,1";
  document.getElementById('af').value = "sigmoid";
  await createButtonPressed();
  document.getElementById('learningrate').value = 0.01;
  document.getElementById('epoch').value = 100000;
  document.getElementById('trainingdata').value = `[ {"X": [ 0, 0 ], "Y":[0]}, {"X": [ 1, 0 ], "Y":[1]}, {"X": [0, 1 ], "Y":[1]}, {"X": [ 1, 1 ], "Y":[0]} ]`
  await trainButtonPressed();
  document.getElementById('testingdata').value = `[ {"X": [ 0, 0 ], "Y":[0]}, {"X": [ 1, 0 ], "Y":[1]}, {"X": [0, 1 ], "Y":[1]}, {"X": [ 1, 1 ], "Y":[0]} ]`;
  await testButtonPressed();
}

let irisDataSelected = async() => {
  document.getElementById("layers").value = "4,10,5,3";
  document.getElementById('af').value = "sigmoid";
  await createButtonPressed();
  document.getElementById('learningrate').value = 0.01;
  document.getElementById('epoch').value = 10000;
  document.getElementById('trainingdata').value = `
  [
    {"X": [5.1,3.5,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [4.9,3.0,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [4.7,3.2,1.3,0.2],"Y":[1,0,0]}, 
    {"X": [4.6,3.1,1.5,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.6,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [5.4,3.9,1.7,0.4],"Y":[1,0,0]}, 
    {"X": [4.6,3.4,1.4,0.3],"Y":[1,0,0]}, 
    {"X": [5.0,3.4,1.5,0.2],"Y":[1,0,0]}, 
    {"X": [4.4,2.9,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [4.9,3.1,1.5,0.1],"Y":[1,0,0]}, 
    {"X": [5.4,3.7,1.5,0.2],"Y":[1,0,0]}, 
    {"X": [4.8,3.4,1.6,0.2],"Y":[1,0,0]}, 
    {"X": [4.8,3.0,1.4,0.1],"Y":[1,0,0]}, 
    {"X": [4.3,3.0,1.1,0.1],"Y":[1,0,0]}, 
    {"X": [5.8,4.0,1.2,0.2],"Y":[1,0,0]}, 
    {"X": [5.7,4.4,1.5,0.4],"Y":[1,0,0]}, 
    {"X": [5.4,3.9,1.3,0.4],"Y":[1,0,0]}, 
    {"X": [5.2,3.4,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [4.7,3.2,1.6,0.2],"Y":[1,0,0]}, 
    {"X": [4.8,3.1,1.6,0.2],"Y":[1,0,0]}, 
    {"X": [5.4,3.4,1.5,0.4],"Y":[1,0,0]}, 
    {"X": [5.2,4.1,1.5,0.1],"Y":[1,0,0]}, 
    {"X": [5.5,4.2,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [4.9,3.1,1.5,0.1],"Y":[1,0,0]}, 
    {"X": [5.0,3.2,1.2,0.2],"Y":[1,0,0]}, 
    {"X": [5.5,3.5,1.3,0.2],"Y":[1,0,0]}, 
    {"X": [4.9,3.1,1.5,0.1],"Y":[1,0,0]}, 
    {"X": [4.4,3.0,1.3,0.2],"Y":[1,0,0]}, 
    {"X": [5.1,3.4,1.5,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.5,1.3,0.3],"Y":[1,0,0]}, 
    {"X": [4.5,2.3,1.3,0.3],"Y":[1,0,0]}, 
    {"X": [4.4,3.2,1.3,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.5,1.6,0.6],"Y":[1,0,0]}, 
    {"X": [5.1,3.8,1.9,0.4],"Y":[1,0,0]}, 
    {"X": [4.8,3.0,1.4,0.3],"Y":[1,0,0]}, 
    {"X": [5.1,3.8,1.6,0.2],"Y":[1,0,0]}, 
    {"X": [4.6,3.2,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [5.3,3.7,1.5,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.3,1.4,0.2],"Y":[1,0,0]}, 
    {"X": [7.0,3.2,4.7,1.4],"Y":[0,1,0]},
    {"X": [6.4,3.2,4.5,1.5],"Y":[0,1,0]},
    {"X": [6.9,3.1,4.9,1.5],"Y":[0,1,0]},
    {"X": [5.5,2.3,4.0,1.3],"Y":[0,1,0]},
    {"X": [6.5,2.8,4.6,1.5],"Y":[0,1,0]},
    {"X": [5.7,2.8,4.5,1.3],"Y":[0,1,0]},
    {"X": [6.3,3.3,4.7,1.6],"Y":[0,1,0]},
    {"X": [4.9,2.4,3.3,1.0],"Y":[0,1,0]},
    {"X": [6.6,2.9,4.6,1.3],"Y":[0,1,0]},
    {"X": [5.2,2.7,3.9,1.4],"Y":[0,1,0]},
    {"X": [5.0,2.0,3.5,1.0],"Y":[0,1,0]},
    {"X": [5.9,3.0,4.2,1.5],"Y":[0,1,0]},
    {"X": [6.0,2.2,4.0,1.0],"Y":[0,1,0]},
    {"X": [6.1,2.9,4.7,1.4],"Y":[0,1,0]},
    {"X": [5.6,2.9,3.6,1.3],"Y":[0,1,0]},
    {"X": [6.7,3.1,4.4,1.4],"Y":[0,1,0]},
    {"X": [5.6,3.0,4.5,1.5],"Y":[0,1,0]},
    {"X": [5.8,2.7,4.1,1.0],"Y":[0,1,0]},
    {"X": [6.2,2.2,4.5,1.5],"Y":[0,1,0]},
    {"X": [5.6,2.5,3.9,1.1],"Y":[0,1,0]},
    {"X": [5.9,3.2,4.8,1.8],"Y":[0,1,0]},
    {"X": [6.1,2.8,4.0,1.3],"Y":[0,1,0]},
    {"X": [6.3,2.5,4.9,1.5],"Y":[0,1,0]},
    {"X": [6.1,2.8,4.7,1.2],"Y":[0,1,0]},
    {"X": [6.4,2.9,4.3,1.3],"Y":[0,1,0]},
    {"X": [6.6,3.0,4.4,1.4],"Y":[0,1,0]},
    {"X": [6.8,2.8,4.8,1.4],"Y":[0,1,0]},
    {"X": [6.7,3.0,5.0,1.7],"Y":[0,1,0]},
    {"X": [6.0,2.9,4.5,1.5],"Y":[0,1,0]}, 
    {"X": [5.7,2.6,3.5,1.0],"Y":[0,1,0]}, 
    {"X": [6.1,3.0,4.6,1.4],"Y":[0,1,0]}, 
    {"X": [5.8,2.6,4.0,1.2],"Y":[0,1,0]}, 
    {"X": [5.0,2.3,3.3,1.0],"Y":[0,1,0]},
    {"X": [5.6,2.7,4.2,1.3],"Y":[0,1,0]},
    {"X": [5.7,3.0,4.2,1.2],"Y":[0,1,0]},
    {"X": [5.7,2.9,4.2,1.3],"Y":[0,1,0]},
    {"X": [6.2,2.9,4.3,1.3],"Y":[0,1,0]},
    {"X": [5.1,2.5,3.0,1.1],"Y":[0,1,0]},
    {"X": [5.7,2.8,4.1,1.3],"Y":[0,1,0]},
    {"X": [6.3,3.3,6.0,2.5],"Y":[0,0,1]}, 
    {"X": [5.8,2.7,5.1,1.9],"Y":[0,0,1]}, 
    {"X": [7.1,3.0,5.9,2.1],"Y":[0,0,1]}, 
    {"X": [6.3,2.9,5.6,1.8],"Y":[0,0,1]}, 
    {"X": [6.5,3.0,5.8,2.2],"Y":[0,0,1]}, 
    {"X": [7.6,3.0,6.6,2.1],"Y":[0,0,1]}, 
    {"X": [4.9,2.5,4.5,1.7],"Y":[0,0,1]}, 
    {"X": [7.3,2.9,6.3,1.8],"Y":[0,0,1]}, 
    {"X": [6.7,2.5,5.8,1.8],"Y":[0,0,1]}, 
    {"X": [7.2,3.6,6.1,2.5],"Y":[0,0,1]}, 
    {"X": [6.5,3.2,5.1,2.0],"Y":[0,0,1]}, 
    {"X": [6.4,2.7,5.3,1.9],"Y":[0,0,1]}, 
    {"X": [6.8,3.0,5.5,2.1],"Y":[0,0,1]}, 
    {"X": [5.7,2.5,5.0,2.0],"Y":[0,0,1]}, 
    {"X": [5.8,2.8,5.1,2.4],"Y":[0,0,1]}, 
    {"X": [6.4,3.2,5.3,2.3],"Y":[0,0,1]}, 
    {"X": [6.5,3.0,5.5,1.8],"Y":[0,0,1]}, 
    {"X": [7.7,3.8,6.7,2.2],"Y":[0,0,1]}, 
    {"X": [7.7,2.6,6.9,2.3],"Y":[0,0,1]}, 
    {"X": [6.0,2.2,5.0,1.5],"Y":[0,0,1]}, 
    {"X": [6.9,3.2,5.7,2.3],"Y":[0,0,1]}, 
    {"X": [5.6,2.8,4.9,2.0],"Y":[0,0,1]}, 
    {"X": [7.7,2.8,6.7,2.0],"Y":[0,0,1]}, 
    {"X": [6.3,2.7,4.9,1.8],"Y":[0,0,1]}, 
    {"X": [6.7,3.3,5.7,2.1],"Y":[0,0,1]}, 
    {"X": [7.2,3.2,6.0,1.8],"Y":[0,0,1]}, 
    {"X": [6.2,2.8,4.8,1.8],"Y":[0,0,1]}, 
    {"X": [6.1,3.0,4.9,1.8],"Y":[0,0,1]}, 
    {"X": [6.4,2.8,5.6,2.1],"Y":[0,0,1]}, 
    {"X": [7.2,3.0,5.8,1.6],"Y":[0,0,1]}, 
    {"X": [7.4,2.8,6.1,1.9],"Y":[0,0,1]}, 
    {"X": [7.9,3.8,6.4,2.0],"Y":[0,0,1]}, 
    {"X": [6.4,2.8,5.6,2.2],"Y":[0,0,1]}, 
    {"X": [6.3,2.8,5.1,1.5],"Y":[0,0,1]}, 
    {"X": [6.1,2.6,5.6,1.4],"Y":[0,0,1]}, 
    {"X": [7.7,3.0,6.1,2.3],"Y":[0,0,1]}, 
    {"X": [6.3,3.4,5.6,2.4],"Y":[0,0,1]}, 
    {"X": [6.4,3.1,5.5,1.8],"Y":[0,0,1]}, 
    {"X": [6.2,3.4,5.4,2.3],"Y":[0,0,1]}, 
    {"X": [5.9,3.0,5.1,1.8],"Y":[0,0,1]}
]` ;
  await trainButtonPressed();
  document.getElementById('testingdata').value = `
  [
    {"X": [6.0,3.0,4.8,1.8],"Y":[0,0,1]},
    {"X": [6.9,3.1,5.4,2.1],"Y":[0,0,1]},
    {"X": [6.7,3.1,5.6,2.4],"Y":[0,0,1]},
    {"X": [6.9,3.1,5.1,2.3],"Y":[0,0,1]},
    {"X": [5.8,2.7,5.1,1.9],"Y":[0,0,1]},
    {"X": [6.8,3.2,5.9,2.3],"Y":[0,0,1]},
    {"X": [6.7,3.3,5.7,2.5],"Y":[0,0,1]},
    {"X": [6.7,3.0,5.2,2.3],"Y":[0,0,1]},
    {"X": [6.3,2.5,5.0,1.9],"Y":[0,0,1]},
    {"X": [6.5,3.0,5.2,2.0],"Y":[0,0,1]},
    {"X": [5.5,2.4,3.8,1.1],"Y":[0,1,0]}, 
    {"X": [5.5,2.4,3.7,1.0],"Y":[0,1,0]}, 
    {"X": [5.8,2.7,3.9,1.2],"Y":[0,1,0]},
    {"X": [6.0,2.7,5.1,1.6],"Y":[0,1,0]},
    {"X": [5.4,3.0,4.5,1.5],"Y":[0,1,0]},
    {"X": [6.0,3.4,4.5,1.6],"Y":[0,1,0]},
    {"X": [6.7,3.1,4.7,1.5],"Y":[0,1,0]},
    {"X": [6.3,2.3,4.4,1.3],"Y":[0,1,0]},
    {"X": [5.6,3.0,4.1,1.3],"Y":[0,1,0]},
    {"X": [5.5,2.5,4.0,1.3],"Y":[0,1,0]},
    {"X": [5.5,2.6,4.4,1.2],"Y":[0,1,0]}, 
    {"X": [5.1,3.5,1.4,0.3],"Y":[1,0,0]}, 
    {"X": [5.7,3.8,1.7,0.3],"Y":[1,0,0]}, 
    {"X": [5.1,3.8,1.5,0.3],"Y":[1,0,0]}, 
    {"X": [5.4,3.4,1.7,0.2],"Y":[1,0,0]}, 
    {"X": [5.1,3.7,1.5,0.4],"Y":[1,0,0]}, 
    {"X": [4.6,3.6,1.0,0.2],"Y":[1,0,0]}, 
    {"X": [5.1,3.3,1.7,0.5],"Y":[1,0,0]}, 
    {"X": [4.8,3.4,1.9,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.0,1.6,0.2],"Y":[1,0,0]}, 
    {"X": [5.0,3.4,1.6,0.4],"Y":[1,0,0]}, 
    {"X": [5.2,3.5,1.5,0.2],"Y":[1,0,0]}  
]`;
  await testButtonPressed();
}