"use client"

import * as React from "react"
import { Upload, X, File, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { uploadFile, formatFileSize, getFileIcon, type UploadedFile } from "@/lib/utils/upload-utils"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  onRemove?: (file: UploadedFile) => void
  multiple?: boolean
  maxSize?: number // in MB
  accept?: string
  className?: string
}

export function FileUpload({
  onUploadComplete,
  onRemove,
  multiple = true,
  maxSize = 50,
  accept,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const validFiles = selectedFiles.filter((file) => {
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSize}MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    setFiles((prev) => (multiple ? [...prev, ...validFiles] : validFiles))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    try {
      const uploaded: UploadedFile[] = []
      const total = files.length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadedFile = await uploadFile(file)
        uploaded.push(uploadedFile)
        setProgress(((i + 1) / total) * 100)
      }

      setUploadedFiles((prev) => [...prev, ...uploaded])
      setFiles([])
      onUploadComplete?.(uploaded)

      toast({
        title: "Upload successful",
        description: `${uploaded.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error(" Upload failed:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeUploadedFile = (file: UploadedFile) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))
    onRemove?.(file)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          Max file size: {maxSize}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Selected Files ({files.length})</p>
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload All"
              )}
            </Button>
          </div>

          {uploading && <Progress value={progress} className="h-2" />}

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-muted rounded-lg"
              >
                <span className="text-xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <span className="text-xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeUploadedFile(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
