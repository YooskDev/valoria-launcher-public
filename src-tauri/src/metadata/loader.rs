use std::{error::Error, path::PathBuf};

use serde::{Deserialize, Serialize};

use crate::metadata::handler::{EventHandler, WrappedModpackInstallEvent};

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum ModpackModLoader {
    None,

    Fabric,
    Quilt,
    LegacyFabric,
    Babric,

    Forge,
    NeoForge,
}

impl ModpackModLoader {
    pub fn install(
        &self,
        main_dir: impl Into<PathBuf>,
        mc_dir: impl Into<PathBuf>,
        minecraft_version: &str,
        loader_version: Option<&str>,
        event_handler: Box<dyn Fn(WrappedModpackInstallEvent)>,
    ) -> Result<portablemc::base::Game, Box<dyn Error>> {
        let handler = EventHandler {
            consumer: event_handler,
        };

        match self {
            ModpackModLoader::None => {
                let mut installer = portablemc::moj::Installer::new(
                    portablemc::moj::Version::Name(minecraft_version.to_string()),
                );

                installer.base_mut().set_main_dir(main_dir);
                installer.base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::Fabric => {
                let mut installer = portablemc::fabric::Installer::new(
                    portablemc::fabric::Loader::Fabric,
                    portablemc::fabric::GameVersion::Name(minecraft_version.to_string()),
                    loader_version
                        .map(|version| portablemc::fabric::LoaderVersion::Name(version.to_string()))
                        .unwrap_or(portablemc::fabric::LoaderVersion::Stable),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::Quilt => {
                let mut installer = portablemc::fabric::Installer::new(
                    portablemc::fabric::Loader::Quilt,
                    portablemc::fabric::GameVersion::Name(minecraft_version.to_string()),
                    loader_version
                        .map(|version| portablemc::fabric::LoaderVersion::Name(version.to_string()))
                        .unwrap_or(portablemc::fabric::LoaderVersion::Stable),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::LegacyFabric => {
                let mut installer = portablemc::fabric::Installer::new(
                    portablemc::fabric::Loader::LegacyFabric,
                    portablemc::fabric::GameVersion::Name(minecraft_version.to_string()),
                    loader_version
                        .map(|version| portablemc::fabric::LoaderVersion::Name(version.to_string()))
                        .unwrap_or(portablemc::fabric::LoaderVersion::Stable),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::Babric => {
                let mut installer = portablemc::fabric::Installer::new(
                    portablemc::fabric::Loader::Babric,
                    portablemc::fabric::GameVersion::Name(minecraft_version.to_string()),
                    loader_version
                        .map(|version| portablemc::fabric::LoaderVersion::Name(version.to_string()))
                        .unwrap_or(portablemc::fabric::LoaderVersion::Stable),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::Forge => {
                let mut installer = portablemc::forge::Installer::new(
                    portablemc::forge::Loader::Forge,
                    loader_version
                        .map(|version| portablemc::forge::Version::Name(version.to_string()))
                        .unwrap_or(portablemc::forge::Version::Stable(
                            minecraft_version.to_string(),
                        )),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }

            ModpackModLoader::NeoForge => {
                let mut installer = portablemc::forge::Installer::new(
                    portablemc::forge::Loader::NeoForge,
                    loader_version
                        .map(|version| portablemc::forge::Version::Name(version.to_string()))
                        .unwrap_or(portablemc::forge::Version::Stable(
                            minecraft_version.to_string(),
                        )),
                );

                installer.mojang_mut().base_mut().set_main_dir(main_dir);
                installer.mojang_mut().base_mut().set_mc_dir(mc_dir);

                Ok(installer.install(handler)?)
            }
        }
    }
}
