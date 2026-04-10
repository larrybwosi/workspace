use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            app.deep_link().on_open_url(|event| {
                println!("deep link url: {}", event.urls()[0]);
            });

            #[cfg(any(target_os = "windows", target_os = "linux"))]
            app.deep_link().on_open_url(|event| {
                println!("deep link url: {}", event.urls()[0]);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
