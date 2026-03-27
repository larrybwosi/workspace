import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { generateRandomString } from "@/lib/auth/oauth2"
import crypto from "crypto"

/**
 * POST /api/auth/oauth2/token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const grantType = body.get("grant_type")
    const code = body.get("code")
    const clientId = body.get("client_id")
    const clientSecret = body.get("client_secret")
    const refreshToken = body.get("refresh_token")

    if (grantType === "authorization_code") {
      if (!code || !clientId || !clientSecret) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 })
      }

      const client = await prisma.oAuthClient.findUnique({
        where: { clientId: clientId as string },
      })

      if (!client || client.clientSecret !== clientSecret) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 })
      }

      try {
        const decoded = Buffer.from(code as string, "base64").toString().split(".")
        if (decoded.length !== 2) throw new Error("Invalid format")

        const [codeStr, signature] = decoded
        const expectedSignature = crypto.createHmac("sha256", process.env.BETTER_AUTH_SECRET || "secret")
          .update(codeStr)
          .digest("hex")

        if (signature !== expectedSignature) {
          return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
        }

        const decodedCode = JSON.parse(codeStr)

        if (decodedCode.clientId !== clientId || decodedCode.expiresAt < Date.now()) {
          return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
        }

        const accessToken = generateRandomString(40)
        const newRefreshToken = generateRandomString(40)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await prisma.oAuthToken.create({
          data: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresAt,
            clientId: clientId as string,
            userId: decodedCode.userId,
            scopes: decodedCode.scopes,
          },
        })

        return NextResponse.json({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_type: "Bearer",
          expires_in: 86400,
          scope: decodedCode.scopes.join(" "),
        })
      } catch (e) {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
      }
    } else if (grantType === "refresh_token") {
      if (!refreshToken || !clientId || !clientSecret) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 })
      }

      const existingToken = await prisma.oAuthToken.findUnique({
        where: { refreshToken: refreshToken as string },
      })

      if (!existingToken || existingToken.clientId !== clientId) {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
      }

      const accessToken = generateRandomString(40)
      const newRefreshToken = generateRandomString(40)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.oAuthToken.update({
        where: { id: existingToken.id },
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresAt,
        },
      })

      return NextResponse.json({
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: 86400,
        scope: existingToken.scopes.join(" "),
      })
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 })
  } catch (error) {
    console.error("OAuth2 Token error:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
