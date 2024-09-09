import { CardRankings, CHANCE_PR, N_ACTIONS } from "./constants";
import { Card } from "./types";

type Action = "p" | "b";

class KhunGame {
  infoSets: Map<string, InfoSet>;

  constructor() {
    this.infoSets = new Map();
  }

  getInfoSet(card: Card, history: string) {
    const key = card + history;
    const infoSet = this.infoSets.get(key);
    if (infoSet === undefined) {
      const newInfoset = new InfoSet();
      this.infoSets.set(key, newInfoset);
      return newInfoset;
    }
    return infoSet;
  }

  chanceEvent(): number {
    const deck: Card[] = ["J", "Q", "K"];
    const numCombinations = 6;
    let expectedValue = 0;
    // Run cfr for all combinations of dealt hands
    for (const c1 of deck) {
      for (const c2 of deck) {
        if (c1 === c2) continue;
        expectedValue += this.cfr("", c1, c2);
      }
    }
    return expectedValue / numCombinations;
  }

  isTerminal(history: string) {
    return [
      "pp", //  Both players passed
      "bb", //  Both players bet
      "bp", //  Player 2 folded
      "pbp", // Player 1 folded
      "pbb", // Player 1 called
    ].includes(history);
  }

  payoff(history: string, card1: Card, card2: Card): number {
    const isPlayer1 = history.length % 2 === 0;
    const player = isPlayer1 ? card1 : card2;
    const opponent = isPlayer1 ? card2 : card1;

    if (history === "bp" || history === "pbp") {
      return 1;
    } else if (history === "pp") {
      return CardRankings[player] > CardRankings[opponent] ? 1 : -1;
    }
    return CardRankings[player] > CardRankings[opponent] ? 2 : -2;
  }

  getActions(): Action[] {
    return ["p", "b"];
  }

  cfr(
    history: string = "",
    c1: Card | null = null,
    c2: Card | null = null,
    pr1: number = 1,
    pr2: number = 1
  ): number {
    if (!c1 || !c2) {
      return this.chanceEvent();
    }
    if (this.isTerminal(history)) {
      return this.payoff(history, c1, c2);
    }

    const isPlayer1 = history.length % 2 === 0;
    const infoSet = this.getInfoSet(isPlayer1 ? c1 : c2, history);
    const strategy = infoSet.strategy;

    if (isPlayer1) infoSet.reachPr += pr1;
    else infoSet.reachPr += pr2;

    const actionUtils: number[] = [0, 0];
    const actions = this.getActions();
    for (let i = 0; i < actions.length; i++) {
      const nextHistory = history + actions[i];
      if (isPlayer1) {
        actionUtils[i] =
          -1 * this.cfr(nextHistory, c1, c2, pr1 * strategy[i], pr2);
      } else {
        actionUtils[i] =
          -1 * this.cfr(nextHistory, c1, c2, pr1, pr2 * strategy[i]);
      }
    }

    const util = actionUtils.reduce(
      (acc, util, i) => (acc += util * strategy[i]),
      0
    );

    // if (c1 === "K") {
    //   if (isPlayer1) {
    //     console.log(c1 + history, actionUtils);
    //   } else {
    //     console.log(c2 + history, actionUtils);
    //   }
    //   console.log("strategy util", util);
    // }

    const regrets = actionUtils.map((actionUtil) => actionUtil - util);
    if (isPlayer1) {
      infoSet.regretSum = regrets.map((r, i) => {
        return infoSet.regretSum[i] + pr2 * CHANCE_PR * r;
      });
    } else {
      infoSet.regretSum = regrets.map((r, i) => {
        return infoSet.regretSum[i] + pr1 * CHANCE_PR * r;
      });
    }

    return util;
  }
}

export function displayResults(ev: number, infoSets: Map<string, InfoSet>) {
  console.log("Player 1 expected value:", ev.toFixed(10));
  console.log("Player 2 expected value:", (-ev).toFixed(10));
  console.log(" ");

  console.log("Player 1 strategies:");
  for (const key of infoSets.keys()) {
    if (key.length === 2) continue;
    const infoSet = infoSets.get(key);
    if (infoSet === undefined) continue;

    const strategy = infoSet.avgStrategy().map((v) => v.toFixed(2));
    console.log(key, strategy);
  }
  console.log(" ");

  console.log("Player 2 strategies:");
  for (const key of infoSets.keys()) {
    if (key.length !== 2) continue;
    const infoSet = infoSets.get(key);
    if (infoSet === undefined) continue;

    const strategy = infoSet.avgStrategy().map((v) => v.toFixed(2));
    console.log(key, strategy);
  }
}

export function Game() {
  const game = new KhunGame();

  const iterations = 100 * 1000;
  let ev = 0;
  for (let i = 0; i < iterations; i++) {
    ev += game.cfr();
    for (const key of game.infoSets.keys()) {
      const infoSet = game.infoSets.get(key);
      infoSet?.nextStrategy();
    }
  }
  ev /= iterations;

  displayResults(ev, game.infoSets);
}

class InfoSet {
  regretSum: number[];
  strategySum: number[];
  strategy: number[];
  reachPr: number;
  reachPrSum: number;
  constructor() {
    this.regretSum = [0, 0];
    this.strategySum = [0, 0];
    this.strategy = [1 / N_ACTIONS, 1 / N_ACTIONS];
    this.reachPr = 0;
    this.reachPrSum = 0;
  }

  nextStrategy() {
    this.strategySum = this.strategy.map(
      (r, i) => r * this.reachPr + this.strategySum[i]
    );

    this.strategy = this.calcStrategy();
    this.reachPrSum += this.reachPr;
    this.reachPr = 0;
  }

  calcStrategy() {
    const regrets = this.regretSum.map((r) => Math.max(r, 0));
    const total = regrets.reduce((acc, r) => (acc += r));

    if (total > 0) {
      this.strategy = regrets.map((r) => r / total);
    } else {
      // If the total regrets are 0 than fallback to a uniform strategy
      this.strategy = this.strategy.map(() => 1 / N_ACTIONS);
    }
    return this.strategy;
  }

  avgStrategy() {
    const strategy = this.strategySum
      .map((r) => r / this.reachPrSum)
      .map((r) => (r < 0.001 ? 0 : r)); // remove any values that are likely a mistake

    const total = strategy.reduce((acc, r) => (acc += r));
    return strategy.map((r) => r / total);
  }
}
