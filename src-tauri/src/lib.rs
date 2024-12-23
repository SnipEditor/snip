mod settings;

use tauri::async_runtime::Mutex;
use tauri::menu::{AboutMetadataBuilder, Menu, MenuItemBuilder, SubmenuBuilder};
use tauri::Error::WebviewLabelAlreadyExists;
use tauri::{App, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_store::StoreExt;
use crate::settings::{get_settings, set_preferred_language, set_theme, set_wrap_lines, Settings};

fn setup_menu(app: &mut App) -> Result<(), tauri::Error> {
    let settings = MenuItemBuilder::new("Settings...")
        .id("settings")
        .accelerator("CmdOrCtrl+,")
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
    let edit_sub_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let app_menu = Menu::new(app)?;
    app_menu.append_items(&[&app_sub_menu, &edit_sub_menu])?;
    app_menu.set_as_app_menu()?;

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
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {

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
            app.manage(Mutex::new(settings));
            setup_menu(app)?;

            WebviewWindowBuilder::new(
                app,
                "main".to_string(),
                WebviewUrl::App("windows/index.html".parse().unwrap()),
            )
            .min_inner_size(800.0, 600.0)
            .title("Snip")
            .build()?;
            Ok(())
        })
        .on_window_event(|window, event| if let WindowEvent::Destroyed = event {
            if window.label() == "main" {
                window.app_handle().exit(0);
            }
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_theme,
            set_preferred_language,
            set_wrap_lines,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
