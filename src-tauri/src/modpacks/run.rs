use std::{collections::HashMap, io::Cursor, path::PathBuf, sync::Mutex, io::BufRead};

use itertools::Itertools;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use zip::ZipArchive;

use crate::{
    bundle::{extract::extract_bundle, get_bundle},
    metadata::ModpackMetadata,
    modpacks::install::install_game,
    state::{AppState, CurrentTask, GameState, TaskType},
};

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RunModpackData {
    pub game_dir: String,
    pub modpack_id: String,

    pub bundle_url: String,
    pub bundle_crc32: String,

    pub jvm_args: Vec<String>,

    pub game_args: HashMap<String, String>,
    pub optional_files: HashMap<String, bool>,
}

fn log_launcher(msg: &str) {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| "C:\\".to_string());
    let log_dir = format!("{}\\.yoosk", appdata);
    let _ = std::fs::create_dir_all(&log_dir);
    let log_file = format!("{}\\launcher.log", log_dir);
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file)
    {
        let time_str = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
            Ok(d) => format!("{}", d.as_secs()),
            Err(_) => "0".to_string(),
        };
        use std::io::Write;
        let _ = writeln!(file, "[{}] {}", time_str, msg);
    }
}

async fn run_modpack_inner(
    data: RunModpackData,
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    let modpack_id = data.modpack_id.clone();
    let game_dir = PathBuf::from(data.game_dir.clone());

    log_launcher("run_modpack_inner started");
    state
        .lock()
        .unwrap()
        .set_game_state(app.clone(), GameState::Starting);

    // Download bundle (or get existing)
    let bundle = get_bundle(
        &game_dir,
        &data.modpack_id,
        &data.bundle_url,
        &data.bundle_crc32,
        |progress, max| {
            state.lock().unwrap().set_task(
                app.clone(),
                CurrentTask {
                    task_type: TaskType::DownloadBundle,
                    progress: progress as u32,
                    max: max as u32,
                },
            );
        },
    )
    .await?;

    // Read bundle metadata
    let mut zip = ZipArchive::new(Cursor::new(bundle))
        .map_err(|err| format!("Modpack bundle is not a valid ZIP: {:?}", err))?;

    let metadata_entry = zip
        .by_path("metadata.json")
        .map_err(|err| format!("Failed to read modpack bundle metadata: {:?}", err))?;

    let metadata: ModpackMetadata = serde_json::from_reader(metadata_entry)
        .map_err(|err| format!("Modpack bundle metadata is not valid: {:?}", err))?;

    // Install Minecraft
    let mc_dir = game_dir.join("instances").join(data.modpack_id);

    std::fs::create_dir_all(&mc_dir)
        .map_err(|err| format!("Failed to create the Minecraft directory: {:?}", err))?;

    // Extract CRC32 hash whitelist of mod files from zip
    let mut whitelist_hashes = Vec::new();
    for i in 0..zip.len() {
        if let Ok(entry) = zip.by_index(i) {
            if entry.is_file() {
                if let Some(enclosed) = entry.enclosed_name() {
                    if enclosed.starts_with("mods") {
                        whitelist_hashes.push(format!("{:08x}", entry.crc32()));
                    }
                }
            }
        }
    }

    log_launcher(&format!("Whitelist: collected {} mod hashes", whitelist_hashes.len()));
    let whitelist_path = mc_dir.join(".yoosk_whitelist");
    log_launcher(&format!("Whitelist path: {:?}", whitelist_path));
    match std::fs::File::create(&whitelist_path) {
        Ok(mut f) => {
            use std::io::Write;
            for hash in &whitelist_hashes {
                let _ = writeln!(f, "{}", hash);
            }
            log_launcher(&format!("Whitelist written successfully: {} hashes", whitelist_hashes.len()));
        }
        Err(e) => {
            log_launcher(&format!("ERROR writing whitelist: {:?}", e));
        }
    }

    let mut game_val = None;
    let mut last_err = String::new();
    for attempt in 1..=3 {
        log_launcher(&format!("Attempt {} to install Minecraft...", attempt));
        match install_game(app.clone(), metadata.clone(), &game_dir, &mc_dir).await {
            Ok(g) => {
                game_val = Some(g);
                break;
            }
            Err(e) => {
                log_launcher(&format!("Minecraft install attempt {} failed: {}", attempt, e));
                last_err = e;
                if attempt < 3 {
                    std::thread::sleep(std::time::Duration::from_millis(1500));
                }
            }
        }
    }

    let mut game = match game_val {
        Some(g) => g,
        None => return Err(last_err),
    };

    // Extract bundle
    let mut exclude_paths: Vec<String> = vec![];

    for optional_file in metadata.optional_files {
        let enabled = data
            .optional_files
            .get(&optional_file.path)
            .cloned()
            .unwrap_or(optional_file.default);

        if !enabled {
            exclude_paths.push(optional_file.path);
        }
    }

    extract_bundle(zip, &mc_dir, exclude_paths, |progress, max| {
        state.lock().unwrap().set_task(
            app.clone(),
            CurrentTask {
                task_type: TaskType::ExtractBundle,
                progress: progress as u32,
                max: max as u32,
            },
        );
    })
    .await
    .map_err(|err| format!("Failed to extract modpack bundle: {:?}", err))?;

    // Apply arguments
    let access_token = data.game_args.get("--accessToken").cloned();
    let mut launch_key: Option<String> = None;
    let mut ac_child: Option<std::process::Child> = None;

    if cfg!(any(target_os = "windows", target_os = "linux", target_os = "macos")) {
        if let Some(ref token) = access_token {
            log_launcher(&format!("Access token found: {}...", &token[..std::cmp::min(10, token.len())]));
                if let Some(ac_path) = find_anticheat_binary(&app) {
                    log_launcher(&format!("Found anticheat binary at: {:?}", ac_path));
                    println!("Found anticheat binary at: {:?}", ac_path);
                    let mut ac_cmd = std::process::Command::new(&ac_path);
                    ac_cmd.arg(token);
                    ac_cmd.arg(std::process::id().to_string()); // Pass launcher PID
                    ac_cmd.stdout(std::process::Stdio::piped());
                ac_cmd.stderr(std::process::Stdio::inherit());
                if let Some(parent) = ac_path.parent() {
                    ac_cmd.current_dir(parent);
                }

                log_launcher("Spawning anticheat process...");
                let mut child_proc = ac_cmd.spawn()
                    .map_err(|err| {
                        log_launcher(&format!("Failed to spawn anticheat: {:?}", err));
                        format!("Failed to spawn anticheat: {:?}", err)
                    })?;

                let ac_stdout = child_proc.stdout.take().ok_or_else(|| {
                    log_launcher("Failed to open anticheat stdout");
                    "Failed to open anticheat stdout".to_string()
                })?;
                let mut reader = std::io::BufReader::new(ac_stdout);
                let mut key = None;
                let mut line = String::new();

                log_launcher("Reading anticheat stdout loop started...");
                while reader.read_line(&mut line).is_ok() {
                    if line.is_empty() {
                        log_launcher("Stdout EOF reached");
                        break;
                    }
                    let trimmed = line.trim();
                    log_launcher(&format!("[AC Line] {}", trimmed));
                    println!("[Anticheat] {}", trimmed);
                    if trimmed.contains("SUCCESS. Launch Key:") {
                        if let Some(idx) = trimmed.find("SUCCESS. Launch Key:") {
                            let k = trimmed[idx + "SUCCESS. Launch Key:".len()..].trim().to_string();
                            log_launcher(&format!("Found Launch Key match: {}", k));
                            key = Some(k);
                            break;
                        }
                    }
                    if trimmed.contains("Blocked:") || trimmed.contains("API Rejected") || trimmed.contains("Rejected") {
                        log_launcher(&format!("Anticheat blocked: {}", trimmed));
                        let _ = child_proc.kill();
                        return Err(format!("Anticheat blocked launch: {}", trimmed));
                    }
                    line.clear();
                }

                if let Some(k) = key {
                    log_launcher("Successfully obtained launch key from anticheat");
                    launch_key = Some(k);
                    ac_child = Some(child_proc);
                } else {
                    log_launcher("No launch key found, checking try_wait...");
                    match child_proc.try_wait() {
                        Ok(Some(status)) => {
                            log_launcher(&format!("Anticheat exited prematurely. Status: {}", status));
                            return Err(format!("Anticheat exited before providing a launch key. Status: {}", status));
                        }
                        Ok(None) => {
                            log_launcher("Anticheat is still running but did not output key.");
                            let _ = child_proc.kill();
                            return Err("Failed to obtain launch key from anticheat".to_string());
                        }
                        Err(e) => {
                            log_launcher(&format!("try_wait error: {:?}", e));
                            let _ = child_proc.kill();
                            return Err("Failed to obtain launch key from anticheat".to_string());
                        }
                    }
                }
            } else {
                log_launcher("Anticheat binary not found!");
                return Err("Anticheat binary (yoosk-anticheat.exe / yoosk_ac.exe) not found. Cannot launch game without anticheat protection.".to_string());
            }
        } else {
            log_launcher("No access token provided, skipping anticheat");
        }
    }

    let mut game_args_modified = data.game_args.clone();
    if let Some(ref lkey) = launch_key {
        if let Some(token) = game_args_modified.get_mut("--accessToken") {
            *token = format!("{}:{}", token, lkey);
        }
    }

    for (key, value) in game.game_args.iter_mut().tuples() {
        let Some(new_value) = game_args_modified.get(key) else {
            continue;
        };

        *value = new_value.to_string();
    }

    if let Some(auth_server) = metadata.auth_server {
        let injector_path = find_authlib_injector(&app)
            .ok_or_else(|| "authlib-injector-1.2.7.jar not found. Cannot launch Minecraft with custom authentication server.".to_string())?;

        game.jvm_args.push(format!(
            "-javaagent:{}={}",
            
            dunce::canonicalize(injector_path)
                .map_err(|err| format!("Unable to canonicalize path: {:?}", err))?
                .to_string_lossy(),

            auth_server
        ));
        game.jvm_args.push("-Dauthlibinjector.profileKey=disabled".to_string());
    }

    game.jvm_args.append(&mut data.jvm_args.clone());

    // Launch
    let mut child = game
        .spawn()
        .map_err(|err| format!("Failed to start Minecraft: {:?}", err))?;

    state.lock().unwrap().reset_task(app.clone());

    state
        .lock()
        .unwrap()
        .set_game_state(app.clone(), GameState::Running);

    // Hide launcher window during game session
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }

    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<Mutex<AppState>>();

        let mut game_child = child;
        let mut ac_proc_opt = ac_child;

        log_launcher("Background monitor thread loop started in launcher");
        loop {
            // 1. Check if Minecraft has stopped
            match game_child.try_wait() {
                Ok(Some(status)) => {
                    log_launcher(&format!("Game stopped. Status: {:?}", status));
                    if let Some(mut ac_proc) = ac_proc_opt.take() {
                        log_launcher("Terminating anticheat process...");
                        let _ = ac_proc.kill();
                    }
                    break;
                }
                Ok(None) => {}
                Err(e) => {
                    log_launcher(&format!("Error waiting for game: {:?}", e));
                    if let Some(mut ac_proc) = ac_proc_opt.take() {
                        log_launcher("Terminating anticheat process on error...");
                        let _ = ac_proc.kill();
                    }
                    break;
                }
            }

            // 2. Check if Anticheat has stopped unexpectedly (e.g. killed by the user)
            if let Some(ref mut ac_proc) = ac_proc_opt {
                match ac_proc.try_wait() {
                    Ok(Some(status)) => {
                        log_launcher(&format!("Anticheat stopped unexpectedly! Status: {:?}", status));
                        log_launcher("Forcefully terminating Minecraft game process...");
                        let _ = game_child.kill();
                        kill_minecraft_process(&modpack_id, game_child.id());
                        
                        // Show warning dialog to the user
                        use tauri_plugin_dialog::DialogExt;
                        app.dialog()
                            .message("Игра была принудительно закрыта, так как античит Yoosk прекратил работу в фоновом режиме.")
                            .title("Yoosk Active Guard")
                            .show(|_| {});

                        ac_proc_opt = None;
                        break;
                    }
                    Ok(None) => {}
                    Err(e) => {
                        log_launcher(&format!("Error waiting for anticheat: {:?}", e));
                    }
                }
            }

            std::thread::sleep(std::time::Duration::from_millis(500));
        }

        log_launcher("Background monitor thread loop exited in launcher");

        if let Some(ref token) = access_token {
            log_launcher("Sending launch key revocation request to backend...");
            let client = reqwest::blocking::Client::new();
            let res = client.post("http://45.90.247.244:3000/1/anticheat/revoke")
                .bearer_auth(token)
                .send();
            match res {
                Ok(resp) => {
                    log_launcher(&format!("Revocation request response: {:?}", resp.status()));
                }
                Err(err) => {
                    log_launcher(&format!("Failed to send revocation request: {:?}", err));
                }
            }
        }

        state
            .lock()
            .unwrap()
            .set_game_state(app.clone(), GameState::Stopped);

        // Show launcher window again when the game stops
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.show();
            let _ = w.set_focus();
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn run_modpack(
    data: RunModpackData,
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    match run_modpack_inner(data, app.clone(), state.clone()).await {
        Ok(()) => Ok(()),
        Err(err) => {
            state.lock().unwrap().reset_task(app.clone());

            state
                .lock()
                .unwrap()
                .set_game_state(app.clone(), GameState::Stopped);

            // Show launcher window again since launch was aborted
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }

            let is_anticheat_violation = err.contains("Anticheat blocked") 
                || err.contains("Failed to obtain launch key") 
                || err.contains("Anticheat exited");

            if is_anticheat_violation {
                log_launcher(&format!("Quietly handling anticheat block/exit: {}", err));
                Ok(())
            } else {
                Err(err)
            }
        }
    }
}

fn find_anticheat_binary(app: &tauri::AppHandle) -> Option<PathBuf> {
    log_launcher("find_anticheat_binary search started");
    let bin_name = if cfg!(target_os = "windows") { "yoosk-anticheat.exe" } else { "yoosk-anticheat" };
    let bin_name_alt = if cfg!(target_os = "windows") { "yoosk_ac.exe" } else { "yoosk_ac" };

    // Helper closure to check and log a path
    let check_path = |desc: &str, path: PathBuf| -> Option<PathBuf> {
        let exists = path.exists();
        log_launcher(&format!("Checking {}: {:?} (exists: {})", desc, path, exists));
        if exists {
            Some(path)
        } else {
            None
        }
    };

    // 1. Check the known build output directory first (always has the freshest build)
    if let Some(p) = check_path(
        "Temp build output path",
        PathBuf::from("C:\\temp\\yoosk_ac_target\\release\\yoosk-anticheat.exe"),
    ) {
        return Some(p);
    }

    // 2. Check current directory (next to launcher exe)
    if let Ok(current_exe) = std::env::current_exe() {
        log_launcher(&format!("current_exe path: {:?}", current_exe));
        if let Some(parent) = current_exe.parent() {
            if let Some(p) = check_path("Parent dir alt name", parent.join(bin_name_alt)) {
                return Some(p);
            }
            if let Some(p) = check_path("Parent dir default name", parent.join(bin_name)) {
                return Some(p);
            }
        }
    }

    // 3. Check relative dev paths
    if let Ok(current_dir) = std::env::current_dir() {
        log_launcher(&format!("current_dir path: {:?}", current_dir));
        
        // Sibling target/release path (when running from src-tauri, which makes it 2 levels up)
        if let Some(p) = check_path(
            "Sibling dev release (2 levels up)",
            current_dir.join(format!("../../yoosk-anticheat/target/release/{}", bin_name)),
        ) {
            return Some(p);
        }
        
        // Sibling target/release path (when running from workspace root, 1 level up)
        if let Some(p) = check_path(
            "Sibling dev release (1 level up)",
            current_dir.join(format!("../yoosk-anticheat/target/release/{}", bin_name)),
        ) {
            return Some(p);
        }

        if let Some(p) = check_path(
            "Inner dev release",
            current_dir.join(format!("yoosk-anticheat/target/release/{}", bin_name)),
        ) {
            return Some(p);
        }

        // Compiled target path C:\temp\yoosk_ac_target
        if let Some(p) = check_path(
            "Temp launcher target path",
            PathBuf::from(format!("C:\\temp\\launcher_target\\release\\{}", bin_name)),
        ) {
            return Some(p);
        }

        // PyInstaller paths
        if let Some(p) = check_path(
            "Sibling PyInstaller dist (2 levels up)",
            current_dir.join(format!("../../yoosk-anticheat/dist/{}", bin_name_alt)),
        ) {
            return Some(p);
        }
        if let Some(p) = check_path(
            "Sibling PyInstaller dist (1 level up)",
            current_dir.join(format!("../yoosk-anticheat/dist/{}", bin_name_alt)),
        ) {
            return Some(p);
        }
        if let Some(p) = check_path(
            "Inner PyInstaller dist",
            current_dir.join(format!("yoosk-anticheat/dist/{}", bin_name_alt)),
        ) {
            return Some(p);
        }
    }

    // 4. Check Tauri resources directory
    if let Ok(path) = app.path().resolve(bin_name, tauri::path::BaseDirectory::Resource) {
        if let Some(p) = check_path("Tauri Resource bin_name", path) {
            return Some(p);
        }
    }
    if let Ok(path) = app.path().resolve(format!("resources/{}", bin_name), tauri::path::BaseDirectory::Resource) {
        if let Some(p) = check_path("Tauri Resource resources/bin_name", path) {
            return Some(p);
        }
    }
    if let Ok(path) = app.path().resolve(bin_name_alt, tauri::path::BaseDirectory::Resource) {
        if let Some(p) = check_path("Tauri Resource bin_name_alt", path) {
            return Some(p);
        }
    }
    if let Ok(path) = app.path().resolve(format!("resources/{}", bin_name_alt), tauri::path::BaseDirectory::Resource) {
        if let Some(p) = check_path("Tauri Resource resources/bin_name_alt", path) {
            return Some(p);
        }
    }

    log_launcher("Anticheat binary NOT found in any search location");
    None
}


fn find_authlib_injector(app: &tauri::AppHandle) -> Option<PathBuf> {
    // 1. Resolve via BaseDirectory::Resource (without prefix)
    if let Ok(path) = app.path().resolve("authlib-injector-1.2.7.jar", tauri::path::BaseDirectory::Resource) {
        if path.exists() {
            return Some(path);
        }
    }
    // 2. Resolve via BaseDirectory::Resource (with prefix)
    if let Ok(path) = app.path().resolve("resources/authlib-injector-1.2.7.jar", tauri::path::BaseDirectory::Resource) {
        if path.exists() {
            return Some(path);
        }
    }
    // 3. Check next to the launcher executable
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            let path = parent.join("authlib-injector-1.2.7.jar");
            if path.exists() {
                return Some(path);
            }
            let path = parent.join("resources").join("authlib-injector-1.2.7.jar");
            if path.exists() {
                return Some(path);
            }
        }
    }
    // 4. Check current directory / dev directories
    if let Ok(current_dir) = std::env::current_dir() {
        let path = current_dir.join("resources/authlib-injector-1.2.7.jar");
        if path.exists() {
            return Some(path);
        }
        let path = current_dir.join("src-tauri/resources/authlib-injector-1.2.7.jar");
        if path.exists() {
            return Some(path);
        }
        let path = current_dir.join("authlib-injector-1.2.7.jar");
        if path.exists() {
            return Some(path);
        }
    }
    None
}

fn kill_minecraft_process(modpack_id: &str, pid: u32) {
    log_launcher(&format!("kill_minecraft_process called: modpack_id={}, pid={}", modpack_id, pid));
    
    use sysinfo::System;
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let pid_str = pid.to_string();
    
    // 1. Kill by PID matching
    for (sys_pid, process) in sys.processes() {
        if sys_pid.to_string() == pid_str {
            log_launcher(&format!("Killing process by PID match {}: {:?}", pid, process.name().to_string_lossy()));
            let _ = process.kill();
        }
    }
    
    // 2. Kill any Java process matching the modpack ID in command line arguments
    for (sys_pid, process) in sys.processes() {
        let name = process.name().to_string_lossy().to_lowercase();
        if name.contains("javaw") || name.contains("java") {
            let cmd_args = process.cmd();
            let is_matching = cmd_args.iter().any(|arg| {
                arg.to_string_lossy().contains(modpack_id)
            });
            if is_matching {
                log_launcher(&format!("Killing matching java process PID {}: {:?}", sys_pid, cmd_args));
                let _ = process.kill();
            }
        }
    }
}
