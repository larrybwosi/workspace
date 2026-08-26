use std::collections::HashMap;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_deep_link::DeepLinkExt;

#[derive(serde::Deserialize)]
pub struct ProxyRequest {
    pub method: String,
    pub path: String,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<serde_json::Value>,
    pub base_url: Option<String>,
}

#[derive(serde::Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: serde_json::Value,
}

#[tauri::command]
async fn api_request(request: ProxyRequest) -> Result<ProxyResponse, String> {
    let mut config = scryme_sdk::apis::configuration::Configuration::new();

    if let Some(ref base) = request.base_url {
        let mut trimmed = base.trim_end_matches('/').to_string();
        if trimmed.ends_with("/api") {
            trimmed = trimmed[..trimmed.len() - 4].to_string();
        }
        config.base_path = trimmed;
    }

    let client = config.client;

    let full_url = format!("{}{}", config.base_path, request.path);
    let method = request.method.parse::<reqwest::Method>().map_err(|e| e.to_string())?;

    let mut req_builder = client.request(method, &full_url);

    if let Some(headers) = request.headers {
        for (k, v) in headers {
            req_builder = req_builder.header(k, v);
        }
    }

    if let Some(body) = request.body {
        req_builder = req_builder.json(&body);
    }

    let response = req_builder.send().await.map_err(|e| e.to_string())?;

    let status = response.status().as_u16();

    let mut res_headers = HashMap::new();
    for (name, value) in response.headers() {
        if let Ok(val_str) = value.to_str() {
            res_headers.insert(name.as_str().to_string(), val_str.to_string());
        }
    }

    let body_text = response.text().await.map_err(|e| e.to_string())?;
    let body_json: serde_json::Value = serde_json::from_str(&body_text)
        .unwrap_or(serde_json::Value::String(body_text));

    Ok(ProxyResponse {
        status,
        headers: res_headers,
        body: body_json,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let _ = app.emit("deep-link://new-url", args);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
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

            let icon = app.default_window_icon().cloned().unwrap_or_else(|| {
                // Fallback or handle missing icon
                tauri::image::Image::new_owned(vec![0; 16], 2, 2)
            });

            let tray = TrayIconBuilder::new()
                .icon(icon)
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

            app.manage(tray);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![api_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
