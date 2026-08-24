# Scryme Chat - Desktop Application (`apps/desktop`)

The **Scryme Chat Desktop Client** is a lightweight, cross-platform native application (macOS, Windows, and Linux) built with **Tauri v2**, **React 19**, **Vite**, and **Tailwind CSS v4**. It offers native system integration, desktop notifications, deep linking support, offline caching, and native window controls.

---

## 💻 Key Features

- **Cross-Platform Native Desktop Shell**: Engineered with Tauri v2 (Rust backend), providing a tiny footprint (~15MB installer size) and low memory usage.
- **Custom Frameless Titlebar**: Custom window header with drag regions, minimize, maximize, and close controls tailored for enterprise aesthetics.
- **System Tray Integration**: Background tray icon support allowing the app to stay active for real-time message notifications when closed or minimized.
- **Native OS Notifications**: Desktop notifications powered by `@tauri-apps/plugin-notification` when mentions (`@user`) or direct messages are received.
- **Deep Link Handler**: Custom protocol registration (`scryme://`) via `@tauri-apps/plugin-deep-link` enabling one-click navigation to channels or DM threads from external browsers.
- **Local SQLite Persistence**: Embedded SQLite storage (`@tauri-apps/plugin-sql`) for fast local message history access and offline settings.
- **Dynamic API URL Switcher**: Custom server URL selector stored in `window.localStorage` (`CUSTOM_API_URL`) to seamlessly switch between self-hosted on-premise instances and cloud endpoints.
- **Voice & Video Conferencing**: Low-latency group calls powered by Agora RTC.

---

## 🛠 Tech Stack

- **Desktop Framework**: [Tauri v2](https://tauri.app/) (Rust)
- **Frontend UI**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Plugins**: `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-deep-link`, `@tauri-apps/plugin-sql`, `@tauri-apps/plugin-store`
- **State & Realtime**: `@repo/api-client`, `@repo/shared`

---

## 🚀 Development Setup

### Prerequisites

1. **Node.js** `v22.x` and **pnpm** `v10.33.0`
2. **Rust Toolchain**: Installed via [rustup.rs](https://rustup.rs/) (`rustc`, `cargo`)
3. **Platform Build Dependencies**:
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Linux (Ubuntu/Debian)**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libappindicator3-dev librsvg2-dev`
   - **Windows**: C++ Build Tools via Visual Studio Installer

### Running Local Development

Launch the desktop app with hot-reloading:

```bash
# From repository root
pnpm --filter desktop dev

# Or from apps/desktop directory
cd apps/desktop
pnpm tauri dev
```

### Packaging Production Installers

To build release installers (`.dmg` on macOS, `.msi` / `.exe` on Windows, `.AppImage` / `.deb` on Linux):

```bash
pnpm --filter desktop tauri build
```

Compiled installer binaries are generated under `apps/desktop/src-tauri/target/release/bundle/`.
