use std::collections::HashMap;

#[derive(serde::Deserialize)]
pub struct ApiRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

#[derive(serde::Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
}

#[tauri::command]
pub async fn forward_api_request(req: ApiRequest) -> Result<ApiResponse, String> {
    let client = reqwest::Client::new();
    let method = match req.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => return Err(format!("Unsupported method: {}", req.method)),
    };

    let mut builder = client.request(method, &req.url);

    for (k, v) in req.headers {
        if k.to_lowercase() != "host" {
            builder = builder.header(&k, &v);
        }
    }

    if let Some(body) = req.body {
        builder = builder.body(body);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();

    let mut headers = HashMap::new();
    for (k, v) in response.headers().iter() {
        if let Ok(val_str) = v.to_str() {
            headers.insert(k.to_string(), val_str.to_string());
        }
    }

    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(ApiResponse {
        status,
        headers,
        body,
    })
}

#[tauri::command]
pub async fn import_player_asset(
    game_dir: String,
    modpack_id: String,
    asset_type: String, // "resourcepack" or "shaderpack"
    src_file_path: String,
) -> Result<(), String> {
    use std::path::Path;
    use std::fs;

    let src = Path::new(&src_file_path);
    if !src.exists() {
        return Err("Source file does not exist".to_string());
    }

    let filename = src.file_name()
        .ok_or_else(|| "Invalid source file name".to_string())?;

    let dest_dir = Path::new(&game_dir)
        .join("instances")
        .join(&modpack_id)
        .join(match asset_type.as_str() {
            "resourcepack" => "resourcepacks",
            "shaderpack" => "shaderpacks",
            _ => return Err("Invalid asset type".to_string()),
        });

    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create destination folder: {:?}", e))?;

    let dest = dest_dir.join(filename);
    fs::copy(src, dest)
        .map_err(|e| format!("Failed to copy file: {:?}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_player_asset(
    game_dir: String,
    modpack_id: String,
    asset_type: String, // "resourcepack" or "shaderpack"
    filename: String,
) -> Result<(), String> {
    let file_path = std::path::Path::new(&game_dir)
        .join("instances")
        .join(&modpack_id)
        .join(match asset_type.as_str() {
            "resourcepack" => "resourcepacks",
            "shaderpack" => "shaderpacks",
            _ => return Err("Invalid asset type".to_string()),
        })
        .join(filename);

    if file_path.exists() {
        std::fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_custom_assets(
    game_dir: String,
    modpack_id: String,
    asset_type: String, // "resourcepacks" or "shaderpacks"
) -> Result<Vec<String>, String> {
    let folder = std::path::Path::new(&game_dir)
        .join("instances")
        .join(&modpack_id)
        .join(&asset_type);

    if !folder.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    if let Ok(entries) = std::fs::read_dir(folder) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(name) = entry.file_name().to_str() {
                    if entry.path().is_file() {
                        files.push(name.to_string());
                    }
                }
            }
        }
    }
    Ok(files)
}

#[tauri::command]
pub async fn open_instance_folder(
    game_dir: String,
    modpack_id: String,
    sub_folder: String, // "resourcepacks", "shaderpacks" or ""
) -> Result<(), String> {
    let folder = std::path::Path::new(&game_dir)
        .join("instances")
        .join(&modpack_id)
        .join(&sub_folder);

    std::fs::create_dir_all(&folder)
        .map_err(|e| format!("Failed to create folder: {:?}", e))?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn upload_skin(
    url: String,
    access_token: String,
    file_data: String, // base64-encoded PNG
    file_name: String,
    slim: bool,
) -> Result<u16, String> {
    use base64::Engine;

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&file_data)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let part = reqwest::multipart::Part::bytes(bytes)
        .file_name(file_name)
        .mime_str("image/png")
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new().part("file", part);

    let client = reqwest::Client::new();
    let response = client
        .put(&format!("{}?slim={}", url, slim))
        .header("X-Access-Token", &access_token)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    if status >= 200 && status < 300 {
        Ok(status)
    } else {
        let body = response.text().await.unwrap_or_default();
        Err(format!("Server returned {}: {}", status, body))
    }
}
