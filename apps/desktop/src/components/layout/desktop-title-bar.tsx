import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, Copy } from "lucide-react";

export function DesktopTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
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
  }, [appWindow]);

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 w-full select-none items-center justify-between bg-muted/50 px-2 text-muted-foreground transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <span className="text-xs font-medium px-2">Workspace</span>
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
          {isMaximized ? (
            <Copy className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
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
