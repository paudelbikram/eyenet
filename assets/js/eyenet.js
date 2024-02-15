'use strict';

//global here because whole thing depends on neuralnet
let neuralnet = undefined;
let testResult = undefined;
let trainingStat = undefined;
let predictingStat = undefined;
let currentTrainingSteps = undefined;
let currentTestingSteps = undefined;

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

  event.preventDefault();
  event.stopPropagation();

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
    populateTestingData(predictingStat)
  } catch(e){
    hideElement(testInprogress);
    hideElement(testCompleted);
    showElement(testFailed);
    console.error(e);
  }
}



let testNeuralNet = async() =>{
  let dataToTest = await getData('testingdata', 'testingfile', false);
  testResult = [];
  let testStat = [];
  let trackingIndices = new Set(getIndicesToCollectStat(dataToTest.length));
  for(let i = 0; i < dataToTest.length; i++){
    let element = {...dataToTest[i]};
    let result = neuralnet.predict(element['X'], true);
    element['PY'] = result[0];
    testResult.push(element);
    if (trackingIndices.has(i)){
      testStat.push(result[1]);
    }
  }
  console.log('Neural Net has been tested. Testing Stat: ', testStat);
}
  

// runs when train button is pressed 
let trainButtonPressed = async(event)=>{
  let trainInprogress = document.getElementById('train-inprogress');
  let trainFailed = document.getElementById('train-failed');
  let trainCompleted = document.getElementById('train-completed');
  hideElement(trainInprogress);
  hideElement(trainFailed);
  hideElement(trainCompleted);
  showElement(trainInprogress);

  event.preventDefault();
  event.stopPropagation();

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

let trainNeuralNet = async() =>{
  let learningRate = document.getElementById('learningrate').value;
  let epoch = document.getElementById('epoch').value;

  let trainingConfig = sajilonet.TrainingConfig.build(learningRate, epoch);
  let dataToTrain = await getData('trainingdata', 'trainingfile', true);
  trainingStat = neuralnet.fit(dataToTrain,trainingConfig, new Set(getIndicesToCollectStat(epoch)));
  console.log('Neural Net has been trained. Training Stat: ', trainingStat);
}

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


// runs when create button is pressed
let createButtonPressed = async (event) =>{
  let createInprogress = document.getElementById('create-inprogress');
  let createFailed = document.getElementById('create-failed');
  let createCompleted = document.getElementById('create-completed');
  hideElement(createInprogress);
  hideElement(createFailed);
  hideElement(createCompleted);
  showElement(createInprogress);

  event.preventDefault();
  event.stopPropagation();

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

// gets activation function by their name
function getAfByName(name){
  if (name === 'binarystep') return new sajilonet.BinaryStep();
  if (name === 'linear') return new sajilonet.Linear();
  if (name === 'sigmoid') return new sajilonet.Sigmoid();
  if (name === 'relu') return new sajilonet.ReLu();
  if (name === 'tanh') return new sajilonet.Tanh();
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


let showElement = (element)=>{
  if (element.classList.contains('d-none')){
    element.classList.remove('d-none');
  }
}

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


let readFileContent = async(file) => {
  let fileContent = await new Promise((resolve) => {
      let fileReader = new FileReader();
      fileReader.onerror = (e) => resolve(undefined);
      fileReader.onload = (e) => resolve(fileReader.result);
      fileReader.readAsText(file);
  });
  return fileContent;
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

/**This validates method code for activation functions.
 * This one poses a security risk.
 * Be careful
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

let removeAllOptions = (selectElement) => {
  let i, l = selectElement.options.length - 1;
   for(i = l; i >= 0; i--) {
      selectElement.remove(i);
   }
}

let visualTraningDataChange = (value) => {
  let epoch = document.getElementById("visualEpoch").value;
  let trainingSteps = trainingStat.get(parseInt(epoch)).trainingData.get(parseInt(value));
  populateSteps(trainingSteps);
}

let populateSteps = (trainingSteps) => {
  console.log(trainingSteps);
  populateWeight(trainingSteps.weightBefore);
  populateBias(trainingSteps.biasBefore);
  // TODO : Reset Output node value 
  currentTrainingSteps = trainingSteps;
  let steps = document.getElementById('trainingStepLink');
  // resetting 
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
    return `<div class="row align-items-center d-flex flex-row flex-nowrap">
            <div class="col">{${step.operationType.name}}</div>
            <div class="col">
              ${createArgumentDataView(step.argument)}
            </div>
            <div class="col">=</div>
            <div class="col">
              ${createArgumentDataView(step.resultingArgument)}
            </div>
          </div>`;
  } else if (step instanceof sajilonet.BinaryOperation) {
    return `<div class="row align-items-center d-flex flex-row flex-nowrap">
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
          </div>`;
  } else {
    return '';
  }
  
}

let populateStepDetails = (steps) => {
  let detailsDocument = document.getElementById('trainingStepDetails');
  let detailsHtml = [];
  for(let i = 0; i < steps.length; i++) {
    detailsHtml.push(`<li class="list-group-item d-flex flex-row flex-nowrap">${createStepView(steps[i])}</li>`);
  }
  detailsDocument.innerHTML = `
                              <ol class="list-group list-group-numbered list-group-flush">
                                ${detailsHtml.join('')}
                              </ol>`;
  
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

let trainingFeedforwardStepClicked = (step) => {
  console.log('Training Feedforward Stat:', currentTrainingSteps.feedforward);
  console.log('Step', step);
  let steps = currentTrainingSteps.feedforward[step];
  populateStepDetails(steps[0]);
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
  populateStepDetails(steps);
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

let elementWiseContactenationOfMatrices = (matrixA, matrixB) => {
  let result = new sajilonet.Matrix(matrixA.rows, matrixB.cols);
  for (let i = 0; i < result.rows; i++) {
      for (let j = 0; j < result.cols; j++) {
        result.data[i][j] = `${shortenTheNumber(matrixA.data[i][j], 3)} -> ${shortenTheNumber(matrixB.data[i][j], 3)}`;
      }
  }
  return result;
}