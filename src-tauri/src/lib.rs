mod scripts;
mod settings;
mod window;

use crate::scripts::commands::{get_script_commands, reply_editor_request, run_script_command};
use crate::scripts::loader::scripts::ScriptManager;
use crate::settings::{get_settings, open_settings_window, set_preferred_language, set_theme, set_wrap_lines, Settings};
use crate::window::{menu, Windows};
use tauri::async_runtime::{spawn, Mutex};
use tauri::path::BaseDirectory;
use tauri::{Listener, Manager, State, WindowEvent};
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let app = app.clone();
            spawn(async move {
                let windows: State<'_, Mutex<Windows>> = app.state();
                let mut windows = windows.lock().await;
                windows.create_window(&app).unwrap();
            });
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(move |app| {
            let store = app.store("settings.json")?;
            let stored_settings = store.get("settings");
            let settings = match stored_settings {
                Some(stored_settings) => serde_json::from_value(stored_settings).unwrap(),
                None => Settings::default(),
            };

            let script_directory = app
                .path()
                .resolve("resources/scripts/commands/", BaseDirectory::Resource)?;
            let mut script_manager = ScriptManager::new();
            let script_load_result = tauri::async_runtime::block_on(async {
                script_manager.add_location(script_directory).await
            });

            if script_load_result.is_err() {
                println!(
                    "Could not load scripts: {:?}",
                    script_load_result.unwrap_err()
                )
            }

            let mut windows = Windows::new();
            windows.create_window(app.handle())?;
            app.manage(Mutex::new(settings));
            app.manage(Mutex::new(windows));
            app.manage(Mutex::new(script_manager));

            let app_handle = app.handle().clone();
            app.listen_any("open_settings", move |event| {
                open_settings_window(&app_handle);
            });
            let app_handle = app.handle().clone();
            app.listen_any("new_window", move |event| {
                let app_handle = app_handle.clone();
                spawn(async move {
                    let windows: State<'_, Mutex<Windows>> = app_handle.state();
                    let mut windows = windows.lock().await;
                    windows.create_window(&app_handle).unwrap();
                });
            });

            menu::initialize_global_handlers(app.handle());
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::Destroyed => {
                let windows: State<'_, Mutex<Windows>> = window.app_handle().state();
                let windows = &mut windows.blocking_lock();
                windows.destroy_window(window.label());
                if !windows.has_open() {
                    window.app_handle().exit(0);
                }
            }
            WindowEvent::Focused(true) => {
                // setup_menu(window.app_handle(), window.label() == "settings")
                //     .expect("Could not replace menu");
            }
            _ => {}
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_theme,
            set_preferred_language,
            set_wrap_lines,
            get_script_commands,
            run_script_command,
            reply_editor_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
