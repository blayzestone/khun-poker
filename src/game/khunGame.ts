import { GameNode, nodeFactory, TerminalNode } from "./node";
import { Action, Card } from "./types";

export function Game() {
  const game = new KhunGame();

  // for (const entry of game.beliefs.keys()) {
  //   console.log(entry, game.beliefs.get(entry));
  // }
}

export function getOtherCards(player: Card): Card[] {
  const cards: Card[] = ["J", "Q", "K"];
  return cards.filter((c) => c !== player);
}

class KhunGame {
  root: GameNode;
  strategy: InfoSet;
  beliefs: InfoSet;
  cumulativeWeights: InfoSet;

  constructor() {
    const cards: [Card, Card] = ["Q", "J"];
    this.root = nodeFactory(cards);

    this.strategy = new InfoSet();
    this.beliefs = new InfoSet();
    this.cumulativeWeights = new InfoSet();

    this.initStrategy(this.root);
    this.updateBeliefs(this.root, cards[0], cards[1]);

    this.strategy.update(
      {
        hand: "Q",
        actions: ["pass", "bet"],
      },
      [1, 0]
    );
    this.strategy.update(
      {
        hand: "K",
        actions: ["pass", "bet"],
      },
      [1, 0]
    );

    // for (const entry of this.beliefs._infoSet.keys()) {
    //   console.log(entry, this.beliefs._infoSet.get(entry));
    // }
    for (const entry of this.cumulativeWeights._infoSet.keys()) {
      console.log(entry, this.cumulativeWeights._infoSet.get(entry));
    }
  }

  initStrategy(current: GameNode | TerminalNode) {
    if (current instanceof TerminalNode) return;

    const cards: Card[] = ["J", "Q", "K"];

    for (const c of cards) {
      const rng = (Math.random() + Math.random()) / 2;
      this.strategy.update({ hand: c, actions: current.history }, [
        rng,
        1 - rng,
      ]);
    }

    this.initStrategy(current.pass);
    this.initStrategy(current.bet);
  }

  getOpponentRange(node: GameNode, player: Card): number[] {
    // If no action has been taken yet, than the initial expection is 50/50
    if (node.history.length === 0) {
      return [0.5, 0.5];
    }

    const cards = getOtherCards(player);
    const history = [...node.history];
    const lastAction = history.pop();

    const range: number[] = [];
    for (const c of cards) {
      const [pass, bet] = this.strategy.get({
        hand: c,
        actions: history,
      });

      if (lastAction === "pass") range.push(pass);
      else range.push(bet);
    }
    const sum = range.reduce((acc, r) => (acc += r));
    return range.map((r) => r / sum);
  }

  updateBeliefs(current: GameNode | TerminalNode) {
    if (current instanceof TerminalNode) return;

    this.beliefs.update(
      { hand: current.player, actions: current.history },
      this.getOpponentRange(current, current.player)
    );

    this.updateBeliefs(current.pass);
    this.updateBeliefs(current.bet);
  }

  getNodeEV(current: GameNode | TerminalNode, belief: number[]): number {
    if (current instanceof TerminalNode) {
      const oppRange = getOtherCards(current.player);
      let ev = current.payoff(current.player, oppRange[0]) * belief[0];
      ev += current.payoff(current.player, oppRange[1]) * belief[1];
      return ev;
    }

    const passEV = this.getNodeEV(current.pass, belief);
    const betEV = this.getNodeEV(current.bet, belief);
    this.cumulativeWeights.update(
      {
        hand: current.player,
        actions: current.history,
      },
      [passEV, betEV]
    );
    return passEV + betEV;
  }
}

type Key = { hand: Card; actions: Action[] };

class InfoSet {
  _infoSet: Map<string, number[]>;

  constructor() {
    this._infoSet = new Map();
  }

  get(key: Key) {
    const v = this._infoSet.get(this._key(key));
    if (v === undefined) {
      throw new Error(`No key: '${this._key(key)}' for InfoSet`);
    }
    return v;
  }

  update(key: Key, value: number[]) {
    this._infoSet.set(this._key(key), value);
    return this.get(key);
  }

  private _key({ hand, actions }: Key): string {
    return actions.reduce((acc: string, action: Action) => {
      return action === "pass" ? acc + "p" : acc + "b";
    }, hand);
  }
}
