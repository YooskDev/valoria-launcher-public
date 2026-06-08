use std::path::Path;

#[tauri::command]
pub fn list_instances(game_dir: String) -> Result<Vec<String>, String> {
    // Initialize directories
    let mut instances = Vec::<String>::new();
    let path = Path::new(&game_dir).join("instances");

    // If the instances directory doesn't exist, return an empty list
    if !path.is_dir() {
        return Ok(vec![]);
    }

    // Read instances directory
    let entries = Path::read_dir(&path)
        .map_err(|err| format!("Failed to read the instances directory: {:?}", err))?;

    for entry in entries {
        let entry = entry.map_err(|err| {
            format!(
                "Failed to get an entry from the instances directory: {:?}",
                err
            )
        })?;

        instances.push(
            entry
                .file_name()
                .into_string()
                .map_err(|err| format!("Invalid instance directory name. ${:?}", err))?,
        );
    }

    Ok(instances)
}
