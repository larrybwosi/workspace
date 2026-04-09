import { useEffect } from "react";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useNavigate } from "react-router-dom";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

export function useTauri() {
  const navigate = useNavigate();

  useEffect(() => {
    let unlisten: any;

    async function setupDeepLinks() {
      unlisten = await onOpenUrl((urls) => {
        console.log("Opened URLs:", urls);
        for (const url of urls) {
          try {
            // Example: workspace://workspace/slug/channels/channelSlug
            // or workspace://dm/userId
            const path = url.replace("workspace://", "/");
            navigate(path);
          } catch (e) {
            console.error("Failed to parse deep link URL", e);
          }
        }
      });
    }

    setupDeepLinks();

    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  const notify = async (title: string, body: string) => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    if (permissionGranted) {
      sendNotification({ title, body });
    }
  };

  return { notify };
}
