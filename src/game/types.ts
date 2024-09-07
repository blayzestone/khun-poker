export type Action = "pass" | "bet";

export type Card = "K" | "Q" | "J";

export type Strategy = { [key in Action]: number };
