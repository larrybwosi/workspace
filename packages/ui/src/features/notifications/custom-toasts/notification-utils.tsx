import { toast } from "sonner"
import { DiscordNotificationToast } from "./discord-notification-toast"

export const notificationSounds = {
  message: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3", // Discord-like ping
  mention: "https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3", // Discord-like highlight
  call: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3", // Discord-like incoming call
}

export function playNotificationSound(type: keyof typeof notificationSounds) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(notificationSounds[type]);
  audio.play().catch(e => console.error('Failed to play sound:', e));
}

export function showDiscordNotification(payload: {
  id: string
  title: string
  message: string
  avatar?: string
  entityType?: string
  entityId?: string
  linkUrl?: string
  type: string
}) {
  toast.custom((t) => (
    <DiscordNotificationToast
      notification={payload}
      onClose={() => toast.dismiss(t)}
    />
  ), {
    duration: 5000,
  })
}
