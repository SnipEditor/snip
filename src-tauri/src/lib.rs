mod scripts;
mod settings;
mod window;

use crate::scripts::commands::{get_script_commands, reply_editor_request, run_script_command};
use crate::scripts::loader::scripts::ScriptManager;
use crate::settings::{get_settings, set_preferred_language, set_theme, set_wrap_lines, Settings};
use crate::window::{menu, Windows};
use tauri::async_runtime::{spawn, Mutex};
use tauri::menu::{AboutMetadataBuilder, Menu, MenuItemBuilder, Submenu, SubmenuBuilder};
use tauri::path::BaseDirectory;
use tauri::Error::WebviewLabelAlreadyExists;
use tauri::{
    AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder, WindowEvent, Wry,
};
use tauri_plugin_store::StoreExt;

const MENU_ITEM_ID_SETTINGS: &str = "settings";
const MENU_ITEM_ID_NEW_WINDOW: &str = "window_new";
const MENU_ITEM_ID_SCRIPTS_OPEN_PICKER: &str = "scripts_open_picker";
const MENU_ITEM_ID_SCRIPTS_REEXECUTE_LAST: &str = "scripts_reexecute_last";

fn get_file_sub_menu(app: &AppHandle, in_settings: bool) -> Result<Submenu<Wry>, tauri::Error> {
    let mut builder = SubmenuBuilder::new(app, "File");
    if !in_settings {
        let new_window_item = MenuItemBuilder::new("New Window")
            .id(MENU_ITEM_ID_NEW_WINDOW)
            .accelerator("CmdOrCtrl+N")
            .build(app)?;
        builder = builder.item(&new_window_item).separator();
    }
    builder.close_window().build()
}

fn setup_menu(app: &AppHandle, in_settings: bool) -> Result<(), tauri::Error> {
    let settings = MenuItemBuilder::new("Settings...")
        .id(MENU_ITEM_ID_SETTINGS)
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

    let file_sub_menu = get_file_sub_menu(app, in_settings)?;
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
            .id(MENU_ITEM_ID_SCRIPTS_OPEN_PICKER)
            .accelerator("CmdOrCtrl+B")
            .build(app)?;
        let reexecute_last_script_item = MenuItemBuilder::new("Re-execute Last Script")
            .id(MENU_ITEM_ID_SCRIPTS_REEXECUTE_LAST)
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

            menu::initialize_global_handlers(app.handle());

            setup_menu(app.handle(), false)?;

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
            reply_editor_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
