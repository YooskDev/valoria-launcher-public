use std::{collections::HashMap, fs::File, io::Cursor, path::PathBuf};

use path_slash::PathBufExt;
use zip::ZipArchive;

pub async fn extract_bundle(
    mut archive: ZipArchive<Cursor<Vec<u8>>>,
    dest: impl Into<PathBuf>,
    exclude_paths: Vec<String>,
    progress_fn: impl Fn(u64, u64),
) -> Result<(), String> {
    let dest = dest.into();

    let mut expected_files: HashMap<PathBuf, Vec<String>> = HashMap::new();

    // Extract files
    let size = archive.len();

    for i in 0..size {
        progress_fn(i as u64 + 1, size as u64);

        // Make sure the entry is a file
        let mut entry = archive
            .by_index(i)
            .map_err(|err| format!("Failed to read bundle entry: {:?}", err))?;

        if !entry.is_file() {
            continue;
        }

        // Get the path, name and parent dir
        let path = entry
            .enclosed_name()
            .ok_or_else(|| format!("Bundle entry has invalid path: {:?}", entry.name()))?;

        let name = path
            .file_name()
            .ok_or_else(|| format!("Bundle entry path does not have a file name: {:?}", path))?
            .to_string_lossy()
            .to_string();

        let dir = path.parent().map(|path| path.to_path_buf());

        // Skip excluded paths
        if exclude_paths.contains(&path.to_slash_lossy().to_string()) {
            continue;
        }

        // Store for later integrity check, don't check root folder though
        if let Some(dir) = dir {
            if !dir.as_os_str().is_empty() {
                expected_files.entry(dir).or_default().push(name);
            }
        }

        // Resolve target file and create the parent directory if it doesn't exist
        let out_path = &dest.join(path);

        let out_path_parent = out_path
            .parent()
            .ok_or_else(|| format!("Failed to get parent directory for file: {:?}", out_path))?;

        std::fs::create_dir_all(out_path_parent)
            .map_err(|err| format!("Failed to create directory: {:?}", err))?;

        // Compare CRC32 if the file exists
        if out_path.is_file() {
            // Calculate CRC32
            let bytes = std::fs::read(out_path)
                .map_err(|err| format!("Failed to read existing file: {:?}", err))?;

            let crc32 = crc32fast::hash(&bytes);

            // Skip extraction if the file is unchanged
            if crc32 == entry.crc32() {
                continue;
            }
        }

        // Extract the file
        let mut out_file =
            File::create(out_path).map_err(|err| format!("Failed to create file: {:?}", err))?;

        std::io::copy(&mut entry, &mut out_file)
            .map_err(|err| format!("Failed to extract file: {:?}", err))?;
    }

    // Check for redundant files
    for (dir, files) in expected_files.iter() {
        let out_dir = dest.join(dir);

        let dir_entries = std::fs::read_dir(&out_dir)
            .map_err(|err| format!("Failed to read directory: {:?}", err))?;

        for entry in dir_entries {
            let entry = entry
                .map_err(|err| format!("Failed to get an entry from the directory: {:?}", err))?;

            let file_name = entry.file_name().to_string_lossy().to_string();

            if !files.contains(&file_name) {
                let path = entry.path();

                if path.is_file() {
                    std::fs::remove_file(entry.path())
                        .map_err(|err| format!("Failed to remove redundant file: {:?}", err))?;
                }
            }
        }
    }

    Ok(())
}
