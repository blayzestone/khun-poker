import { CardRankings } from "./constants";
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

  isTerminal(history: string) {
    return [
      "pp", //  Both players passed
      "bb", //  Both players bet
      "bp", //  Player 2 folded
      "pbp", // Player 1 folded
      "pbb", // Player 1 called
    ].includes(history);
  }

  payoff(history: string, player: Card, opponent: Card): number {
    if (history === "pp") {
      return CardRankings[player] > CardRankings[opponent] ? 1 : -1;
    }
    if (history === "bb" || history === "pbb") {
      return CardRankings[player] > CardRankings[opponent] ? 2 : -2;
    }
    if (history === "bp") {
      return 1;
    }
    if (history === "pbp") {
      return -1;
    }
    return 0;
  }

  getActions(): Action[] {
    return ["p", "b"];
  }

  playGame(
    p1: Card,
    p2: Card,
    history: string = "",
    traversingPlayer = 0
  ): number {
    if (this.isTerminal(history)) {
      const payoff = this.payoff(history, p1, p2);
      // If P2 is the player traversing than reverse the payoff values
      if (traversingPlayer === 1) {
        return -payoff;
      }
      return payoff;
    }
    const activePlayer = history.length % 2 ? p1 : p2;

    const infoSet = this.getInfoSet(activePlayer, history);
    const utils: number[] = [];
    for (const a of this.getActions()) {
      const nextTraversingPlayer = activePlayer === p1 ? 0 : 1;
      utils.push(this.playGame(p1, p2, history + a, nextTraversingPlayer));
    }

    const strategyEV = utils.reduce(
      (acc, util, i) => (acc += util * infoSet.strategy[i]),
      0
    );

    for (let i = 0; i < utils.length; i++) {
      infoSet.regretSum[i] += utils[i] - strategyEV;
    }
    return strategyEV;
  }
}

export function dealCards(): [Card, Card] {
  const deck: Card[] = ["J", "Q", "K"];
  return [
    deck.splice(Math.floor(Math.random() * deck.length), 1)[0],
    deck.splice(Math.floor(Math.random() * deck.length), 1)[0],
  ];
}

export function Game() {
  const game = new KhunGame();

  const [p1, p2] = dealCards();
  game.playGame(p1, p2);

  for (const key of game.infoSets.keys()) {
    console.log(key, game.infoSets.get(key));
  }
}

class InfoSet {
  strategy: number[];
  regretSum: number[];
  constructor() {
    this.strategy = [0.5, 0.5];
    this.strategy = strategy;
    this.regretSum = [0, 0];
  }
}
