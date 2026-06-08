use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

#[derive(Deserialize, Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub enum GameState {
    #[default]
    Stopped,
    Starting,
    Running,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum TaskType {
    DownloadBundle,
    DownloadGame,
    ExtractBundle,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurrentTask {
    pub task_type: TaskType,
    pub progress: u32,
    pub max: u32,
}

#[derive(Deserialize, Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub game_state: GameState,
    pub current_task: Option<CurrentTask>,
}

impl AppState {
    pub fn set_game_state(&mut self, app: AppHandle, state: GameState) {
        self.game_state = state.clone();
        let _ = app.emit("state", &self);
    }

    pub fn set_task(&mut self, app: AppHandle, task: CurrentTask) {
        self.current_task = Some(task.clone());
        let _ = app.emit("state", &self);
    }

    pub fn reset_task(&mut self, app: AppHandle) {
        self.current_task = None;
        let _ = app.emit("state", &self);
    }
}

#[tauri::command]
pub fn get_state(state: State<'_, Mutex<AppState>>) -> AppState {
    return state.lock().unwrap().clone();
}
