import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"

/**
 * Firebase Configuration for Push Notifications
 * 
 * SECURITY NOTE: The NEXT_PUBLIC_FIREBASE_VAPID_KEY is intentionally public.
 * VAPID (Voluntary Application Server Identification) keys consist of a public/private pair:
 * - Public key (this one): MUST be exposed to the client, NOT a security risk
 * - Private key (server-side): Never expose to client
 * 
 * This is the standard implementation for Web Push Notifications.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | undefined
let messaging: Messaging | undefined

export function initializeFirebase() {
  if (typeof window === "undefined") {
    return { app: undefined, messaging: undefined }
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig)
  } else {
    firebaseApp = getApps()[0]
  }

  if ("Notification" in window && "serviceWorker" in navigator) {
    messaging = getMessaging(firebaseApp)
  }

  return { app: firebaseApp, messaging }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("[v0] Browser doesn't support notifications")
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    console.log("[v0] Notification permission denied")
    return null
  }

  return permission
}

export async function getFirebaseToken(): Promise<string | null> {
  try {
    const { messaging } = initializeFirebase()
    if (!messaging) return null

    const permission = await requestNotificationPermission()
    if (permission !== "granted") return null

    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    return token
  } catch (error) {
    console.error("[v0] Error getting Firebase token:", error)
    return null
  }
}

export function onMessageListener() {
  const { messaging } = initializeFirebase()
  if (!messaging) return Promise.reject("Messaging not initialized")

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

export { messaging }
