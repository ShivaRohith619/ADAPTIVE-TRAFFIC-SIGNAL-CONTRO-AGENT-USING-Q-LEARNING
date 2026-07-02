
export class QLearningAgent {
  qTable: Record<string, number[]> = {};
  learningRate: number = 0.1;
  discountFactor: number = 0.9;
  epsilon: number = 0.2;
  // Actions: (direction * 3) + durationIndex
  // direction: 0:N, 1:S, 2:E, 3:W
  // durationIndex: 0:5s, 1:10s, 2:15s
  actions: number[] = Array.from({ length: 12 }, (_, i) => i);

  constructor(epsilon: number = 0.2) {
    this.epsilon = epsilon;
  }

  getStateKey(laneCounts: number[], waitTimes: number[], currentGreen: number): string {
    // Discretize lane counts: 0, 1-2, 3-5, 6+
    const discCounts = laneCounts.map(count => {
      if (count === 0) return 0;
      if (count <= 2) return 1;
      if (count <= 5) return 2;
      return 3;
    });

    // Discretize wait times: 0-5s, 5-15s, 15s+
    const discWaits = waitTimes.map(time => {
      if (time < 5) return 0;
      if (time < 15) return 1;
      return 2;
    });

    return `${discCounts.join(',')}|${discWaits.join(',')}|${currentGreen}`;
  }

  getBestAction(stateKey: string): number {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = new Array(12).fill(0);
      return Math.floor(Math.random() * 12);
    }

    const values = this.qTable[stateKey];
    let maxVal = -Infinity;
    let bestActions: number[] = [];

    for (let i = 0; i < values.length; i++) {
      if (values[i] > maxVal) {
        maxVal = values[i];
        bestActions = [i];
      } else if (values[i] === maxVal) {
        bestActions.push(i);
      }
    }

    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }

  chooseAction(stateKey: string): number {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * 12);
    }
    return this.getBestAction(stateKey);
  }

  updateQTable(stateKey: string, action: number, reward: number, nextStateKey: string) {
    if (!this.qTable[stateKey]) this.qTable[stateKey] = new Array(12).fill(0);
    if (!this.qTable[nextStateKey]) this.qTable[nextStateKey] = new Array(12).fill(0);

    const currentQ = this.qTable[stateKey][action];
    const maxNextQ = Math.max(...this.qTable[nextStateKey]);
    
    // Q-Learning formula: Q(s,a) = Q(s,a) + alpha * (reward + gamma * max(Q(s',a')) - Q(s,a))
    this.qTable[stateKey][action] = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
  }
}
