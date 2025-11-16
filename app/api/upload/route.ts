import { createClient } from "@sanity/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN!,
  useCdn: false,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 })
    }

    const isImage = file.type.startsWith("image/")
    const assetType = isImage ? "image" : "file"

    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    const asset = await client.assets.upload(assetType, blob, {
      filename: file.name,
      contentType: file.type,
    })

    return NextResponse.json({
      id: asset._id,
      url: asset.url,
      name: file.name,
      type: file.type,
      size: file.size,
      assetId: asset._id,
      metadata: {
        dimensions: isImage ? asset.metadata?.dimensions : undefined,
        duration: asset.metadata?.duration,
      },
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("assetId")

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 })
    }

    await client.delete(assetId)

    return NextResponse.json({ success: true, message: "Asset deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete asset", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
