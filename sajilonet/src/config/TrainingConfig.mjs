export class TrainingConfig{
    static build(learningRate, epoch){
        return new TrainingConfig(learningRate, epoch);
    }

    constructor(learningRate, epoch){
        this.learningRate = learningRate;
        this.epoch = epoch;
    }
}