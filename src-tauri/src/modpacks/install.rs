use std::{path::PathBuf, sync::Mutex};

use tauri::{AppHandle, Manager};

use crate::{
    metadata::{handler::WrappedModpackInstallEvent, ModpackMetadata},
    state::{AppState, CurrentTask, TaskType},
};

pub async fn install_game(
    app: AppHandle,
    metadata: ModpackMetadata,
    game_dir: impl Into<PathBuf>,
    mc_dir: impl Into<PathBuf>,
) -> Result<portablemc::base::Game, String> {
    let game_dir = game_dir.into();
    let mc_dir = mc_dir.into();

    tauri::async_runtime::spawn_blocking(move || {
        metadata
            .mod_loader
            .install(
                game_dir,
                mc_dir,
                &metadata.minecraft_version,
                metadata.loader_version.as_deref(),
                Box::new(move |event| {
                    let WrappedModpackInstallEvent::Base(event) = event else {
                        return;
                    };

                    let portablemc::base::Event::DownloadProgress {
                        size, total_size, ..
                    } = event
                    else {
                        return;
                    };

                    let game_state = app.state::<Mutex<AppState>>();

                    game_state.lock().unwrap().set_task(
                        app.clone(),
                        CurrentTask {
                            task_type: TaskType::DownloadGame,
                            progress: size,
                            max: total_size,
                        },
                    );
                }),
            )
            .map_err(|err| format!("Failed to install Minecraft: {:?}", err))
    })
    .await
    .map_err(|err| format!("Failed to install Minecraft: {:?}", err))?
}
