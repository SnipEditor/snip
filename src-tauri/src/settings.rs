use crate::window::menu;
use serde::{Deserialize, Serialize};
use std::ops::Deref;
use tauri::async_runtime::Mutex;
use tauri::Error::WebviewLabelAlreadyExists;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
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
            wrap_lines: settings_default_wrap_lines(),
        }
    }
}

#[tauri::command]
pub async fn get_settings(state: tauri::State<'_, Mutex<Settings>>) -> Result<Settings, ()> {
    let state = state.lock().await;
    Ok(state.clone())
}

pub fn save_settings(app: AppHandle, settings: &Settings) -> Result<Settings, ()> {
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

pub fn open_settings_window(app: &AppHandle) {
    let settings_window_result = WebviewWindowBuilder::new(
        app,
        "settings".to_string(),
        WebviewUrl::App("windows/settings.html".parse().unwrap()),
    )
    .inner_size(400.0, 250.0)
    .resizable(false)
    .title("Snip Settings")
    .build();
    if let Err(WebviewLabelAlreadyExists(_)) = settings_window_result {
        let webview_windows = app.webview_windows();
        let settings_window = webview_windows.get("settings").unwrap();
        settings_window.unminimize().unwrap(); // Must use it if window is minimized
        settings_window.set_focus().unwrap();
        settings_window.show().unwrap();
    } else {
        let window = settings_window_result.unwrap();
        menu::on_new_window(&window);
    }
}
