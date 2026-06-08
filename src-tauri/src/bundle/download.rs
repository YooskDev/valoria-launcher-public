use std::{cmp::min, fs::File, io::Write, path::Path};

use futures_util::StreamExt;

pub async fn download_bundle(
    path: &Path,
    url: &str,
    progress_fn: impl Fn(u64, u64),
) -> Result<Vec<u8>, String> {
    let mut file = File::create(path)
        .map_err(|err| format!("Failed to open bundle file for writing: {:?}", err))?;

    let response = reqwest::get(url)
        .await
        .map_err(|err| format!("Failed to download bundle: {:?}", err))?;

    let content_length = response
        .content_length()
        .ok_or("Failed to get content length")?;

    let mut bytes: Vec<u8> = vec![];

    let mut downloaded = 0;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|err| format!("Failed to download bundle: {:?}", err))?;

        file.write_all(&chunk)
            .map_err(|err| format!("Failed to write bundle: {:?}", err))?;

        bytes.extend_from_slice(&chunk);

        let new = min(downloaded + (chunk.len() as u64), content_length);
        downloaded = new;

        progress_fn(downloaded, content_length);
    }

    Ok(bytes)
}
