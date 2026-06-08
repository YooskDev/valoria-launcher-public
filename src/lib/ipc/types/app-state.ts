import { CurrentTask } from "./current-task";
import { GameState } from "./game-state";

export interface AppState {
    gameState: GameState;
    currentTask: CurrentTask | null;
}
