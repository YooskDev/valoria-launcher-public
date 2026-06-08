use serde::{Deserialize, Serialize};

use crate::metadata::loader::ModpackModLoader;

pub mod handler;
pub mod loader;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModpackOptionalFile {
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,

    pub path: String,
    pub default: bool,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModpackMetadata {
    pub mod_loader: ModpackModLoader,
    pub loader_version: Option<String>,
    pub minecraft_version: String,
    pub auth_server: Option<String>,
    #[serde(default)]
    pub optional_files: Vec<ModpackOptionalFile>,
    pub mod_count: Option<u32>,
}
