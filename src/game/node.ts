import { CardRankings } from "./constants";
import { Action, Card, Strategy } from "./types";

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

  strategy: { [key in Card]: Strategy };

  constructor(
    pass: GameNode | TerminalNode,
    bet: GameNode | TerminalNode,
    history: Action[]
  ) {
    this.cards = ["Q", "J"];

    this.history = history;
    this.player = this.history.length % 2 === 0 ? this.cards[0] : this.cards[1];

    this.strategy = {
      K: this.randomStrategy(),
      Q: this.randomStrategy(),
      J: this.randomStrategy(),
    };
    this.pass = pass;
    this.bet = bet;
  }

  private randomStrategy(): Strategy {
    const rng = (Math.random() + Math.random()) / 2;
    return { bet: rng, pass: 1 - rng };
  }
}

export class TerminalNode implements KhunNode {
  cards: [Card, Card];
  player: Card;

  constructor(public history: Action[], public type: "showdown" | "fold") {
    this.cards = ["K", "J"];
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

export function nodeFactory(): GameNode {
  return createNodeTree([]);
  function createNodeTree(history: Action[]): GameNode {
    const last = history.length - 1;

    if (history[last] === "pass") {
      // Both players pass
      const pass = new TerminalNode([...history, "pass"], "showdown");
      const bet = createNodeTree([...history, "bet"]);
      return new GameNode(pass, bet, history);
    }
    if (history[last] === "bet") {
      const pass = new TerminalNode([...history, "pass"], "fold");
      const bet = new TerminalNode([...history, "bet"], "showdown");
      return new GameNode(pass, bet, history);
    }

    const pass = createNodeTree([...history, "pass"]);
    const bet = createNodeTree([...history, "bet"]);
    return new GameNode(pass, bet, history);
  }
}
