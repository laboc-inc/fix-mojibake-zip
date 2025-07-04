mod utils;
// Rust + WebAssembly で ZIP ファイル内のファイル名の文字化け（Shift_JIS/EUC-JPなど）をUTF-8に変換する処理

use encoding_rs::{Encoding, EUC_JP, SHIFT_JIS, UTF_8};
use std::io::{Cursor, Read, Write};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use zip::read::ZipArchive;
use zip::write::FullFileOptions;

fn detect_encoding(bytes: &[u8]) -> &'static Encoding {
    let (sjis_decoded, _, sjis_err) = SHIFT_JIS.decode(bytes);
    let (_eucjp_decoded, _, eucjp_err) = EUC_JP.decode(bytes);

    // 優先順位：UTF-8で正しく読める → SHIFT_JIS → EUC-JP
    if let Ok(s) = std::str::from_utf8(bytes) {
        if !s.chars().any(|c| c == '�') {
            return UTF_8;
        }
    }
    if !sjis_err
        && sjis_decoded
            .chars()
            .any(|c| c.is_ascii() || c.is_alphanumeric())
    {
        return SHIFT_JIS;
    }
    if !eucjp_err {
        return EUC_JP;
    }
    // デフォルトは SHIFT_JIS
    SHIFT_JIS
}

#[wasm_bindgen]
pub async fn convert_zip_encoding(f: web_sys::File, encoding: &str) -> Result<Box<[u8]>, JsValue> {
    utils::set_panic_hook();
    let array = JsFuture::from(f.array_buffer()).await?;
    let input = js_sys::Uint8Array::new(&array).to_vec();
    let reader = Cursor::new(input);
    let mut archive = ZipArchive::new(reader)
        .map_err(|e| JsValue::from_str(&format!("ZIPの読み込みに失敗しました: {}", e)))?;

    let mut output_buf = Cursor::new(Vec::new());
    let mut zip_writer = zip::ZipWriter::new(&mut output_buf);

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| JsValue::from_str(&format!("ZIP内のファイル取得失敗: {}", e)))?;

        let name_raw = file.name_raw();

        let encoding: &Encoding = match encoding.to_lowercase().as_str() {
            "sjis" | "shift_jis" => SHIFT_JIS,
            "eucjp" | "euc-jp" => EUC_JP,
            "utf-8" => UTF_8,
            "auto" => detect_encoding(name_raw),
            _ => {
                return Err(JsValue::from_str(
                    "未対応のエンコーディングが指定されました",
                ))
            }
        };

        let (decoded_name, _, had_errors) = encoding.decode(name_raw);
        let safe_name = if had_errors {
            file.name().to_string()
        } else {
            decoded_name.to_string()
        };

        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .map_err(|e| JsValue::from_str(&format!("ファイル読み込み失敗: {}", e)))?;

        zip_writer
            .start_file(safe_name, FullFileOptions::default())
            .map_err(|e| JsValue::from_str(&format!("ZIP書き込み開始失敗: {}", e)))?;

        zip_writer
            .write_all(&contents)
            .map_err(|e| JsValue::from_str(&format!("ZIP書き込み失敗: {}", e)))?;
    }

    zip_writer
        .finish()
        .map_err(|e| JsValue::from_str(&format!("ZIP出力失敗: {}", e)))?;

    Ok(output_buf.into_inner().into_boxed_slice())
}
