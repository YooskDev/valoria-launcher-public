use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    total_memory: u64,
    cpus: u32,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let sys = System::new_all();

    SystemInfo {
        total_memory: sys.total_memory(),
        cpus: sys.cpus().len() as u32,
    }
}
