use tauri::{AppHandle, Emitter, Manager, State, Window};
use tauri::menu::MenuEvent;
use tokio::sync::Mutex;
use crate::settings::open_settings_window;
use crate::window::Windows;

const MENU_ITEM_ID_SETTINGS: &str = "settings";
const MENU_ITEM_ID_NEW_WINDOW: &str = "window_new";
const MENU_ITEM_ID_SCRIPTS_OPEN_PICKER: &str = "scripts_open_picker";
const MENU_ITEM_ID_SCRIPTS_REEXECUTE_LAST: &str = "scripts_reexecute_last";

fn handle_menu_event(app: &AppHandle, window: &Window, event: MenuEvent) {
    match event.id().0.as_str() {
        MENU_ITEM_ID_SETTINGS => {
            open_settings_window(app);
        }
        MENU_ITEM_ID_SCRIPTS_OPEN_PICKER => {
            app.emit_to(window.label(), "open_picker", true)
                .unwrap()
        }
        MENU_ITEM_ID_NEW_WINDOW => {
            let windows: State<'_, Mutex<Windows>> = app.state();
            let mut windows = windows.blocking_lock();
            windows.create_window(app).unwrap();
        }
        _ => {}
    }
}

#[cfg(target_os = "macos")]
pub fn initialize_global_handlers(app: &AppHandle) {
    app.on_menu_event(move |app, event| {
        let focused_window = app.get_focused_window();
        if let Some(focused_window) = focused_window {
            handle_menu_event(app, &focused_window, event);
        } else {
            println!("Warning: No window in focus, ignoring menu event");
        }
    });
}

#[cfg(not(target_os = "macos"))]
pub fn initialize_global_handlers(app: &AppHandle) {}