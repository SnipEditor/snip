use tauri::{AppHandle, Emitter, Manager, WebviewWindow, Window, Wry};
use tauri::menu::{AboutMetadataBuilder, Menu, MenuEvent, MenuItemBuilder, Submenu, SubmenuBuilder};

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

fn build_menu(app: &AppHandle, in_settings: bool) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let settings = MenuItemBuilder::new("Settings...")
        .id(MENU_ITEM_ID_SETTINGS)
        .accelerator("CmdOrCtrl+,")
        .enabled(!in_settings)
        .build(app)?;
    let app_sub_menu_builder = SubmenuBuilder::new(app, "Snip")
        .about(Some(
            AboutMetadataBuilder::new()
                .name(Some("Snip"))
                .comments(Some("A simple text editor for quickly editing snippets"))
                .authors(Some(vec!["Rob Bogie".parse().unwrap()]))
                .build(),
        ))
        .separator()
        .item(&settings)
        .separator();

    #[cfg(target_os = "macos")]
    {
        app_sub_menu_builder = app_sub_menu_builder.services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator();
    }

    let app_sub_menu = app_sub_menu_builder.quit()
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

    Ok(app_menu)
}

fn handle_menu_event(app: &AppHandle, window: &Window, event: MenuEvent) {
    match event.id().0.as_str() {
        MENU_ITEM_ID_SETTINGS => {
            app.emit("open_settings", true).unwrap();
        }
        MENU_ITEM_ID_SCRIPTS_OPEN_PICKER => {
            app.emit_to(window.label(), "open_picker", true)
                .unwrap()
        }
        MENU_ITEM_ID_NEW_WINDOW => {
            app.emit("new_window", true).unwrap();

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
pub fn initialize_global_handlers(_app: &AppHandle) {}

#[cfg(not(target_os = "macos"))]
pub fn on_new_window(window: &WebviewWindow) {
    window.on_menu_event(|window, event| {
        handle_menu_event(window.app_handle(), window, event);
    });

    let menu = build_menu(window.app_handle(), window.label() == "settings").unwrap();
    window.set_menu(menu).unwrap();
}

#[cfg(target_os = "macos")]
pub fn on_new_window(_window: &WebviewWindow) {}