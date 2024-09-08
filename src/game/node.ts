import { CardRankings } from "./constants";
import { Action, Card } from "./types";

interface KhunNode {
  cards: [Card, Card];
  player: Card;
  history: Action[];
}

export class GameNode implements KhunNode {
  // Each card represents a player
  cards: [Card, Card];
  player: Card;
  pass: GameNode | TerminalNode;
  bet: GameNode | TerminalNode;
  history: Action[];

  constructor(
    cards: [Card, Card],
    pass: GameNode | TerminalNode,
    bet: GameNode | TerminalNode,
    history: Action[]
  ) {
    this.cards = cards;

    this.history = history;
    this.player = this.history.length % 2 === 0 ? this.cards[0] : this.cards[1];

    this.pass = pass;
    this.bet = bet;
  }
}

export class TerminalNode implements KhunNode {
  cards: [Card, Card];
  player: Card;

  constructor(
    cards: [Card, Card],
    public history: Action[],
    public type: "showdown" | "fold"
  ) {
    this.cards = cards;
    this.history = history;

    this.player = this.history.length % 2 === 0 ? this.cards[0] : this.cards[1];
  }

  payoff(player: Card, opponent: Card) {
    const lastAction = this.history[this.history.length - 1];
    let v = 1;
    if (this.type === "fold") {
      return player === this.player ? v : -v;
    }
    if (lastAction === "bet") {
      v = 2;
    }
    return CardRankings[player] > CardRankings[opponent] ? v : -v;
  }
}

export function nodeFactory(cards: [Card, Card]): GameNode {
  return createNodeTree([]);
  function createNodeTree(history: Action[]): GameNode {
    const last = history.length - 1;

    if (history[last] === "pass") {
      // Both players pass
      const pass = new TerminalNode(cards, [...history, "pass"], "showdown");
      const bet = createNodeTree([...history, "bet"]);
      return new GameNode(cards, pass, bet, history);
    }
    if (history[last] === "bet") {
      const pass = new TerminalNode(cards, [...history, "pass"], "fold");
      const bet = new TerminalNode(cards, [...history, "bet"], "showdown");

      return new GameNode(cards, pass, bet, history);
    }

    const pass = createNodeTree([...history, "pass"]);
    const bet = createNodeTree([...history, "bet"]);
    return new GameNode(cards, pass, bet, history);
  }
}
