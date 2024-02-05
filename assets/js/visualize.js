'user strict';

const dx = 180;
const dy = 90;
const r = 25;


let populateTestingData = (testingStat) => {
    console.log('Populating testing data', testingStat);
}

let getNeuralNetLayers = (neuralnet) => {
    let nodeConfig = [];
    let pathConfig = [];
    let maxNodeInALayer = 0;
    for(let i = 0; i < neuralnet.weights.length; i++){
        cols = neuralnet.weights[i].cols
        if(cols > maxNodeInALayer){
            maxNodeInALayer = cols;
        }
    }
    let middleNodeInLongestLayer = maxNodeInALayer/2;
    for(let i = 0; i < neuralnet.weights.length; i++){
        rows = neuralnet.weights[i].rows;
        cols = neuralnet.weights[i].cols
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

let angleBetweenTwoPoint = (x1, y1, x2, y2) => {
    let angleInRadian = Math.atan2(y2 - y1, x2 - x1);
    if (angleInRadian < 0){
        angleInRadian += Math.PI * 2;
    }
    return angleInRadian * ( 180 / Math.PI );
}

let getWeightPosition = (a, b, id) => {
    // id will be in the form nn-nn;
    let splitrray = id.split('-');
    let numberToDivide = splitrray[1];
    const posDeterminer = numberToDivide % 3;
    if (posDeterminer == 0){
        return (a + (a + b)/2)/2;
    }else if(posDeterminer == 1){
        return (a + b)/2;
    }else{
        return ((a + b)/2 + b)/2;
    }
}

// life saver 
// [].forEach.call(document.getElementsByClassName('weightText-1'), function (el) {el.setAttribute('fill', 'blue')});
let getLayerIdentifierFromIdForWeight = (id) => {
    let splitrray = id.split('-');
    return splitrray[1][0];
}

// TODO : Let's add ids to these so that these can be targeted correctly later. 
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

    svg.attr("width", nodeConfig.length * 200).attr("height", maxNodeInLayer * 110);

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