// Force recompile to embed new assets
use std::sync::Mutex;
use tauri::Manager;

pub mod api;
pub mod bundle;
pub mod metadata;
pub mod modpacks;
pub mod server_status;
pub mod state;
pub mod system_info;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Bypass system proxy for local Tauri assets to prevent ERR_CONNECTION_REFUSED when proxies like V2Ray are active
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--proxy-bypass-list=tauri.localhost");

    tauri::Builder::default()
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let state = app.state::<Mutex<crate::state::AppState>>();
                let game_running = {
                    let s = state.lock().unwrap();
                    matches!(s.game_state, crate::state::GameState::Running | crate::state::GameState::Starting)
                };
                if game_running {
                    api.prevent_close();
                } else {
                    std::process::exit(0);
                }
            }
        })
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            modpacks::run::run_modpack,
            modpacks::list::list_instances,
            modpacks::metadata::get_modpack_metadata,
            state::get_state,
            system_info::get_system_info,
            server_status::get_server_status,
            api::forward_api_request,
            api::import_player_asset,
            api::delete_player_asset,
            api::list_custom_assets,
            api::open_instance_folder,
            api::upload_skin,
        ])
        .manage(Mutex::new(state::AppState::default()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
