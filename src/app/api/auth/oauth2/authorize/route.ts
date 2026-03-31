import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

/**
 * GET /api/auth/oauth2/authorize
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(url)
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const redirectUri = searchParams.get("redirect_uri")
    const scope = searchParams.get("scope") || "*"
    const state = searchParams.get("state")
    const responseType = searchParams.get("response_type")

    if (responseType !== "code") {
      return NextResponse.json({ error: "unsupported_response_type" }, { status: 400 })
    }

    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: clientId || "" },
    })

    if (!client) {
      return NextResponse.json({ error: "invalid_client" }, { status: 400 })
    }

    if (redirectUri && !client.redirectUris.includes(redirectUri)) {
      return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 })
    }

    // Generate a secure code and sign it
    const codePayload = {
      userId: session.user.id,
      clientId,
      scopes: scope.split(" "),
      expiresAt: Date.now() + 10 * 60 * 1000,
      nonce: crypto.randomBytes(16).toString("hex")
    }

    const codeStr = JSON.stringify(codePayload)
    const signature = crypto.createHmac("sha256", process.env.BETTER_AUTH_SECRET || "secret")
      .update(codeStr)
      .digest("hex")

    const code = Buffer.from(`${codeStr}.${signature}`).toString("base64")

    const callbackUrl = new URL(redirectUri || client.redirectUris[0])
    callbackUrl.searchParams.set("code", code)
    if (state) callbackUrl.searchParams.set("state", state)

    return NextResponse.redirect(callbackUrl)
  } catch (error) {
    console.error("OAuth2 Authorize error:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
