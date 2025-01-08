mod scripts;
mod settings;
mod window;

use crate::scripts::commands::{
    get_script_commands, reply_editor_get_full_text, run_script_command,
};
use crate::scripts::loader::scripts::ScriptManager;
use crate::settings::{get_settings, set_preferred_language, set_theme, set_wrap_lines, Settings};
use crate::window::Windows;
use tauri::async_runtime::Mutex;
use tauri::menu::{AboutMetadataBuilder, Menu, MenuItemBuilder, SubmenuBuilder};
use tauri::path::BaseDirectory;
use tauri::Error::WebviewLabelAlreadyExists;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_store::StoreExt;

fn setup_menu(app: &AppHandle, in_settings: bool) -> Result<(), tauri::Error> {
    let settings = MenuItemBuilder::new("Settings...")
        .id("settings")
        .accelerator("CmdOrCtrl+,")
        .enabled(!in_settings)
        .build(app)?;
    let app_sub_menu = SubmenuBuilder::new(app, "Snip")
        .about(Some(
            AboutMetadataBuilder::new()
                .name(Some("Snip"))
                .comments(Some("A simple text editor for quickly editing snippets"))
                .authors(Some(vec!["Rob Bogie".parse().unwrap()]))
                .build(),
        ))
        .separator()
        .item(&settings)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;
    let file_sub_menu = SubmenuBuilder::new(app, "File").close_window().build()?;

    let app_menu = Menu::new(app)?;

    if !in_settings {
        let edit_sub_menu = SubmenuBuilder::new(app, "Edit")
            .undo()
            .redo()
            .separator()
            .cut()
            .copy()
            .paste()
            .select_all()
            .build()?;

        let open_script_picker_item = MenuItemBuilder::new("Open Picker")
            .id("scripts_open_picker")
            .accelerator("CmdOrCtrl+B")
            .build(app)?;
        let reexecute_last_script_item = MenuItemBuilder::new("Re-execute Last Script")
            .id("scripts_reexecute_last")
            .accelerator("CmdOrCtrl+Shift+B")
            .enabled(false)
            .build(app)?;
        let scripts_sub_menu = SubmenuBuilder::new(app, "Scripts")
            .item(&open_script_picker_item)
            .separator()
            .item(&reexecute_last_script_item)
            .build()?;
        app_menu.append_items(&[
            &app_sub_menu,
            &file_sub_menu,
            &edit_sub_menu,
            &scripts_sub_menu,
        ])?;

        app.on_menu_event(move |app, event| {
            if event.id() == settings.id() {
                let settings_window_result = WebviewWindowBuilder::new(
                    app,
                    "settings".to_string(),
                    WebviewUrl::App("windows/settings.html".parse().unwrap()),
                )
                .min_inner_size(200.0, 400.0)
                .title("Snip Settings")
                .build();
                if let Err(WebviewLabelAlreadyExists(_)) = settings_window_result {
                    let webview_windows = app.webview_windows();
                    let settings_window = webview_windows.get("settings").unwrap();
                    settings_window.unminimize().unwrap(); // Must use it if window is minimized
                    settings_window.set_focus().unwrap();
                    settings_window.show().unwrap();
                }
            } else if event.id() == open_script_picker_item.id() {
                let focused_window = app.get_focused_window();
                if let Some(focused_window) = focused_window {
                    if focused_window.label() != "settings" {
                        app.emit_to(focused_window.label(), "open_picker", true)
                            .unwrap()
                    }
                }
            }
        });
    } else {
        app_menu.append_items(&[&app_sub_menu, &file_sub_menu])?;
    }
    app_menu.set_as_app_menu()?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
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
            setup_menu(app.handle(), false)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::Destroyed => {
                if window.label() == "main" {
                    window.app_handle().exit(0);
                }
            }
            WindowEvent::Focused(true) => {
                setup_menu(window.app_handle(), window.label() == "settings")
                    .expect("Could not replace menu");
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
            reply_editor_get_full_text,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
