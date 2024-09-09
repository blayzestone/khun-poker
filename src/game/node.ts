export class KhunNode {
  regretSum: number[];
  strategy: number[];
  strategySum: number[];
  numActions: number;

  constructor() {
    this.regretSum = [0, 0];
    this.strategy = [0, 0];
    this.strategySum = [0, 0];
    this.numActions = 2;
  }

  getStrategy() {
    let normalizingSum = 0;
    for (let i = 0; i < this.numActions; i++) {
      if (this.regretSum[i] > 0) this.strategy[i] = this.regretSum[i];
      else this.strategy[i] = 0;

      normalizingSum += this.strategy[i];
    }
    for (let i = 0; i < this.numActions; i++) {
      if (normalizingSum > 0) this.strategy[i] /= normalizingSum;
      else this.strategy[i] = 1 / this.numActions;
    }

    return this.strategy;
  }
}
