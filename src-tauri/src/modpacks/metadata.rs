use std::{fs::File, path::PathBuf};

use crate::metadata::ModpackMetadata;

#[tauri::command(rename_all = "camelCase")]
pub async fn get_modpack_metadata(
    game_dir: String,
    id: String,
) -> Result<Option<ModpackMetadata>, String> {
    let game_dir = PathBuf::from(game_dir.clone());

    // Get metadata file
    let instance_dir = game_dir.join("instances").join(id);
    let metadata_file = instance_dir.join("metadata.json");

    if !metadata_file.is_file() {
        return Ok(None);
    }

    // Parse metadata
    let metadata_file = File::open(metadata_file)
        .map_err(|err| format!("Failed to open modpack metadata file: {:?}", err))?;

    let metadata = serde_json::from_reader(metadata_file)
        .map_err(|err| format!("Failed to read modpack metadata: {:?}", err))?;

    Ok(Some(metadata))
}
