use std::path::Path;

use crate::bundle::download::download_bundle;

pub mod download;
pub mod extract;

pub async fn get_bundle(
    base_dir: &Path,
    modpack_id: &str,
    url: &str,
    crc32: &str,
    progress_fn: impl Fn(u64, u64),
) -> Result<Vec<u8>, String> {
    // Initialize bundles directory
    let bundles_dir = base_dir.join("bundles");

    std::fs::create_dir_all(&bundles_dir)
        .map_err(|err| format!("Failed to create bundles directory: {:?}", err))?;

    // Check for existing bundle
    let bundle_file = bundles_dir.join(modpack_id);

    if !bundle_file.is_file() {
        return download_bundle(&bundle_file, url, progress_fn).await;
    }

    // Read existing bundle
    progress_fn(0, 1);

    let bytes = std::fs::read(&bundle_file)
        .map_err(|err| format!("Failed to read modpack bundle: {:?}", err))?;

    progress_fn(1, 1);

    // Verify CRC32
    let current_crc32 = crc32fast::hash(&bytes).to_string();

    if current_crc32 != crc32 {
        return download_bundle(&bundle_file, url, progress_fn).await;
    }

    Ok(bytes)
}
