use std::ops::Deref;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri::async_runtime::Mutex;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone)]
enum Theme {
    System,
    Dark,
    Light,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    theme: Theme,
    #[serde(default = "settings_default_preferred_language")]
    preferred_language: String,
    #[serde(default = "settings_default_wrap_lines")]
    wrap_lines: bool,
}

fn settings_default_preferred_language() -> String {
    "markdown".to_string()
}
fn settings_default_wrap_lines() -> bool {
    false
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: Theme::System,
            preferred_language: settings_default_preferred_language(),
            wrap_lines: settings_default_wrap_lines()
        }
    }
}

#[tauri::command]
pub async fn get_settings(state: tauri::State<'_, Mutex<Settings>>) -> Result<Settings, ()> {
    let state = state.lock().await;
    Ok(state.clone())
}

pub fn save_settings(app: AppHandle, settings: &Settings) -> Result<Settings, ()>  {
    let store = app.store("settings.json").expect("failed to get store");
    store.set(
        "settings",
        serde_json::to_value(settings).expect("failed to serialize settings"),
    );
    store.save().expect("Could not save settings");
    app.emit("settings_update", settings)
        .expect("Could not emit settings_update event");
    Ok(settings.clone())
}

#[tauri::command]
pub async fn set_theme(
    app: AppHandle,
    state: tauri::State<'_, Mutex<Settings>>,
    theme: &str,
) -> Result<Settings, ()> {
    let mut state = state.lock().await;
    state.theme = match theme {
        "Light" => Theme::Light,
        "Dark" => Theme::Dark,
        _ => Theme::System,
    };
    save_settings(app, state.deref())
}

#[tauri::command]
pub async fn set_preferred_language(
    app: AppHandle,
    state: tauri::State<'_, Mutex<Settings>>,
    preferred_language: &str,
) -> Result<Settings, ()> {
    let mut state = state.lock().await;
    state.preferred_language = preferred_language.to_string();
    save_settings(app, state.deref())
}

#[tauri::command]
pub async fn set_wrap_lines(
    app: AppHandle,
    state: tauri::State<'_, Mutex<Settings>>,
    wrap_lines: bool,
) -> Result<Settings, ()> {
    let mut state = state.lock().await;
    state.wrap_lines = wrap_lines;
    save_settings(app, state.deref())
}