use std::time::Duration;

use rust_mc_status::McClient;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerStatus {
    pub online_players: i64,
    pub max_players: i64,
}

#[tauri::command]
pub async fn get_server_status(host: String) -> Result<ServerStatus, String> {
    let client = McClient::new()
        .with_timeout(Duration::from_secs(5))
        .with_max_parallel(10);

    let status = client
        .ping_java(&host)
        .await
        .map_err(|err| format!("Error pinging server: {:?}", err))?;

    let (online, max) = status
        .players()
        .ok_or("Player count missing from response.")?;

    Ok(ServerStatus {
        online_players: online,
        max_players: max,
    })
}
