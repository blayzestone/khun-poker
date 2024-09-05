type Action = "pass" | "bet";

type Card = "K" | "Q" | "J";

type Strategy = {
  [key in Action]: number;
};

interface KhunNode {
  history: Action[];
}

export function Game() {
  const game = new KhunGame();

  let current: GameNode | TerminalNode = game.root;
  while (current instanceof GameNode) {
    const action: Action = Math.random() < 0.5 ? "pass" : "bet";
    current.logStrategyTable("K");
    current = current[action];
  }
}

class KhunGame {
  root: GameNode;
  constructor() {
    this.root = nodeFactory();
  }
}

class GameNode implements KhunNode {
  // Each card represents a player
  cards: [Card, Card];
  turn: number;
  player: Card;
  strategy: { [key in Card]: Strategy };
  pass: GameNode | TerminalNode;
  bet: GameNode | TerminalNode;
  history: Action[];

  constructor(
    pass: GameNode | TerminalNode,
    bet: GameNode | TerminalNode,
    history: Action[]
  ) {
    this.cards = ["K", "Q"];
    this.turn = 0;
    this.player = this.turn % 2 === 0 ? this.cards[0] : this.cards[1];

    this.strategy = {
      J: this.initStrategy(),
      Q: this.initStrategy(),
      K: this.initStrategy(),
    };
    this.history = history;

    this.pass = pass;
    this.bet = bet;
  }
  private initStrategy(): Strategy {
    const rng = Math.random();
    return { bet: rng, pass: 1 - rng };
  }

  logStrategyTable(player: Card) {
    const infoSet = this.history.reduce((acc: string, action: Action) => {
      if (action === "pass") return acc + "p";
      else return acc + "b";
    }, player);

    const strategy = this.strategy[player];
    console.log(`${infoSet} pass: 
      Pass: ${strategy.pass.toFixed(2)}
      pass: ${strategy.bet.toFixed(2)}`);
  }
}

class TerminalNode implements KhunNode {
  constructor(public value: number, public history: Action[]) {
    this.value = value;
    this.history = history;
  }
}

export function nodeFactory(): GameNode {
  return createNodeTree([]);
  function createNodeTree(history: Action[]): GameNode {
    const last = history.length - 1;

    if (history[last] === "pass") {
      // Both players pass
      const pass = new TerminalNode(-1, [...history, "pass"]);
      const bet = createNodeTree([...history, "bet"]);
      return new GameNode(pass, bet, history);
    }
    if (history[last] === "bet") {
      const pass = new TerminalNode(-1, [...history, "pass"]);
      const bet = new TerminalNode(-1, [...history, "bet"]);
      return new GameNode(pass, bet, history);
    }

    const pass = createNodeTree([...history, "pass"]);
    const bet = createNodeTree([...history, "bet"]);
    return new GameNode(pass, bet, history);
  }
}
