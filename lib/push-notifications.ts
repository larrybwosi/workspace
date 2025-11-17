import { prisma } from "@/lib/prisma"
import * as admin from "firebase-admin"

let firebaseAdmin: admin.app.App | undefined

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })

    return firebaseAdmin
  } catch (error) {
    console.error(" Firebase Admin initialization error:", error)
    return undefined
  }
}

interface PushNotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  linkUrl?: string
  notificationId?: string
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  const { userId, title, body, data, imageUrl, linkUrl, notificationId } = payload

  // Get all active device tokens for the user
  const deviceTokens = await prisma.deviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
  })

  if (deviceTokens.length === 0) {
    console.log(" No active device tokens found for user:", userId)
    return []
  }

  const results = await Promise.allSettled(
    deviceTokens.map(async (device) => {
      switch (device.platform) {
        case "web":
          return sendWebPushNotification(device.token, { title, body, data, imageUrl, linkUrl, notificationId, userId })
        case "ios":
        case "android":
          return sendExpoPushNotification(device.token, { title, body, data, imageUrl, notificationId, userId })
        case "desktop":
          return sendDesktopPushNotification(device.token, { title, body, data, linkUrl, notificationId, userId })
        default:
          throw new Error(`Unsupported platform: ${device.platform}`)
      }
    })
  )

  return results
}

async function sendWebPushNotification(
  token: string,
  payload: {
    title: string
    body: string
    data?: Record<string, string>
    imageUrl?: string
    linkUrl?: string
    notificationId?: string
    userId: string
  }
) {
  try {
    const firebaseAdmin = getFirebaseAdmin()
    if (!firebaseAdmin) {
      throw new Error("Firebase Admin not initialized")
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          ...(payload.imageUrl && { image: payload.imageUrl }),
        },
        fcmOptions: {
          link: payload.linkUrl || "/",
        },
      },
      data: {
        ...payload.data,
        notificationId: payload.notificationId || "",
        linkUrl: payload.linkUrl || "",
      },
    }

    const response = await firebaseAdmin.messaging().send(message)

    // Log successful notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: "web",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "sent",
      },
    })

    return { success: true, messageId: response }
  } catch (error: any) {
    console.error(" Web push notification error:", error)

    // Log failed notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: "web",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "failed",
        error: error.message,
      },
    })

    // Deactivate invalid tokens
    if (error.code === "messaging/invalid-registration-token" || error.code === "messaging/registration-token-not-registered") {
      await prisma.deviceToken.updateMany({
        where: { token },
        data: { isActive: false },
      })
    }

    throw error
  }
}

async function sendExpoPushNotification(
  token: string,
  payload: {
    title: string
    body: string
    data?: Record<string, string>
    imageUrl?: string
    notificationId?: string
    userId: string
  }
) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          notificationId: payload.notificationId || "",
        },
        badge: 1,
        priority: "high",
      }),
    })

    const result = await response.json()

    if (result.data?.status === "error") {
      throw new Error(result.data.message || "Expo push failed")
    }

    // Log successful notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: token.includes("[") ? "android" : "ios",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "sent",
      },
    })

    return { success: true, result }
  } catch (error: any) {
    console.error(" Expo push notification error:", error)

    // Log failed notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: "mobile",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "failed",
        error: error.message,
      },
    })

    // Deactivate invalid tokens
    if (error.message?.includes("DeviceNotRegistered") || error.message?.includes("InvalidCredentials")) {
      await prisma.deviceToken.updateMany({
        where: { token },
        data: { isActive: false },
      })
    }

    throw error
  }
}

async function sendDesktopPushNotification(
  token: string,
  payload: {
    title: string
    body: string
    data?: Record<string, string>
    linkUrl?: string
    notificationId?: string
    userId: string
  }
) {
  try {
    // For Tauri, we'll use a WebSocket or HTTP endpoint that the desktop app polls
    // This is a placeholder implementation - adjust based on your Tauri setup
    const response = await fetch(`${process.env.DESKTOP_NOTIFICATION_ENDPOINT}/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: payload.data,
        linkUrl: payload.linkUrl,
        notificationId: payload.notificationId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Desktop notification failed: ${response.statusText}`)
    }

    // Log successful notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: "desktop",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "sent",
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error(" Desktop push notification error:", error)

    // Log failed notification
    await prisma.pushNotificationLog.create({
      data: {
        userId: payload.userId,
        notificationId: payload.notificationId,
        platform: "desktop",
        deviceToken: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "failed",
        error: error.message,
      },
    })

    throw error
  }
}
