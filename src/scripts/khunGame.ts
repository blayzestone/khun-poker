type Action = "pass" | "bet";

type Card = "K" | "Q" | "J";

type Strategy = { [key in Action]: number };

class KhunGame {
  root: GameNode;
  constructor() {
    this.root = nodeFactory();
  }
}

interface KhunNode {
  cards: [Card, Card];
  player: Card;
  history: Action[];
}

class GameNode implements KhunNode {
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
    this.cards = ["K", "Q"];

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

  next(): GameNode | TerminalNode {
    return Math.random() < this.strategy[this.player].bet
      ? this.bet
      : this.pass;
  }
}

const CardRankings = {
  K: 2,
  Q: 1,
  J: 0,
};

class TerminalNode implements KhunNode {
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

type HandRange = {
  high: number;
  low: number;
};

export function getOtherCards(player: Card): Card[] {
  const cards: Card[] = ["J", "Q", "K"];
  return cards.filter((c) => c !== player);
}

export function getOpponentRange(player: Card, node: GameNode): HandRange {
  const cards = getOtherCards(player);
  const lastAction = node.history[node.history.length - 1];

  const low = node.strategy[cards[0]][lastAction];
  const high = node.strategy[cards[1]][lastAction];
  const sum = low + high;

  return {
    low: low / sum,
    high: high / sum,
  };
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

export function Game() {
  const game = new KhunGame();
  PlayGame("Q", game.root.bet);
}

export function GetEV(
  player: Card,
  opponentRange: HandRange,
  node: TerminalNode
): number {
  const otherCards = getOtherCards(player);

  let ev = node.payoff(player, otherCards[0]) * opponentRange.low;
  ev += node.payoff(player, otherCards[1]) * opponentRange.high;
  return ev;
}

export function PlayGame(player: Card, current: GameNode | TerminalNode) {
  if (current instanceof TerminalNode) return;

  const nextNode = current.next();
  if (nextNode instanceof TerminalNode) {
    const opponentRange = getOpponentRange(player, current);
    GetEV(player, opponentRange, nextNode);
  }

  PlayGame(player, nextNode);
}
