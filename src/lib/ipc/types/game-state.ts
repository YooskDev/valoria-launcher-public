export const GAME_STATES = <const>["stopped", "starting", "running"];

export type GameState = (typeof GAME_STATES)[number];
