import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Ably from "ably"

// Token authentication endpoint for Ably
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = new Ably.Rest({ key: process.env.ABLY_API_KEY })

    const tokenRequest = await client.auth.createTokenRequest({
      clientId: session.user.id,
      capability: {
        "*": ["publish", "subscribe", "presence"],
      },
    })

    return NextResponse.json(tokenRequest)
  } catch (error) {
    console.error(" Ably token generation error:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}
