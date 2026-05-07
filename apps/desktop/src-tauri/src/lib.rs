use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WebviewEvent, Runtime,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tauri::command]
fn set_badge_count<R: Runtime>(app_handle: tauri::AppHandle<R>, count: i32) {
    #[cfg(target_os = "macos")]
    {
        let _ = app_handle.set_badge_count(count as i64);
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            app.deep_link().on_open_url(|event| {
                println!("deep link url: {}", event.urls()[0]);
            });

            #[cfg(any(target_os = "windows", target_os = "linux"))]
            app.deep_link().on_open_url(|event| {
                println!("deep link url: {}", event.urls()[0]);
            });

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_badge_count])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            RunEvent::WindowEvent {
                label,
                event: win_event,
                ..
            } => {
                if let WebviewEvent::CloseRequested { api, .. } = win_event {
                    let window = app_handle.get_webview_window(&label).unwrap();
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
            _ => {}
        });
}
