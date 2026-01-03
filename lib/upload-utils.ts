export interface UploadedFile {
  id: string
  url: string
  name: string
  type: string
  size: string
  assetId: string
  metadata?: {
    dimensions?: { width: number; height: number }
    duration?: number
  }
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload file")
  }

  return response.json()
}

export async function deleteFile(assetId: string): Promise<void> {
  const response = await fetch(`/api/upload?assetId=${assetId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete file")
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️"
  if (type.startsWith("video/")) return "🎥"
  if (type.startsWith("audio/")) return "🎵"
  if (type.includes("pdf")) return "/pdf.svg"
  if (type.includes("word") || type.includes("document")) return "/word.svg"
  if (type.includes("excel") || type.includes("spreadsheet")) return "/xls.svg"
  if (type.includes("powerpoint") || type.includes("presentation")) return "/ppt.svg"
  if (type.includes("zip") || type.includes("rar")) return "🗜️"
  return "📎"
}
