import { GameNode, nodeFactory, TerminalNode } from "./node";
import { Action, Card } from "./types";

class KhunGame {
  root: GameNode;
  constructor() {
    this.root = nodeFactory();
  }
}

export function Game() {
  const game = new KhunGame();

  const beliefs = new Map<[Card, Action[]], HandRange>();

  crawlGameTree("Q", game.root, beliefs);

  for (const entry of beliefs.keys()) {
    console.log(entry);
  }
}

export function getOtherCards(player: Card): Card[] {
  const cards: Card[] = ["J", "Q", "K"];
  return cards.filter((c) => c !== player);
}

type HandRange = {
  low: number;
  high: number;
};

type Beliefs = Map<[Card, Action[]], HandRange>;

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

export function crawlGameTree(
  player: Card,
  current: GameNode | TerminalNode,
  beliefs: Beliefs
) {
  if (current instanceof TerminalNode) return;

  if (player === current.player) {
    beliefs.set([player, current.history], getOpponentRange(player, current));
  }

  crawlGameTree(player, current.pass, beliefs);
  crawlGameTree(player, current.bet, beliefs);
}
