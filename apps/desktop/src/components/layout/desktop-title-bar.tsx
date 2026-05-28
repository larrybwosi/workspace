import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { X, Minus, Square, Copy } from 'lucide-react';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

export function DesktopTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if we are running in Tauri
    setIsTauri(!!window.__TAURI_INTERNALS__);

    if (window.__TAURI_INTERNALS__) {
      const appWindow = getCurrentWindow();
      const updateMaximized = async () => {
        setIsMaximized(await appWindow.isMaximized());
      };

      updateMaximized();
      const unlisten = appWindow.onResized(() => {
        updateMaximized();
      });

      return () => {
        unlisten.then(u => u());
      };
    }
  }, []);

  if (!isTauri) return null;

  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 w-full select-none items-center justify-between border-b bg-background px-2 text-muted-foreground"
    >
      <div className="flex items-center gap-2 pointer-events-none h-full">
        <div className="flex items-center gap-1.5 px-2">
          <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span className="text-[11px] font-bold tracking-tight uppercase">Scrymechat</span>
        </div>
      </div>

      <div className="flex items-center h-full">
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-full w-10 items-center justify-center hover:bg-muted-foreground/10"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-full w-10 items-center justify-center hover:bg-muted-foreground/10"
        >
          {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-full w-10 items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
