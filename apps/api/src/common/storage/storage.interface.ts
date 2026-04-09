export interface UploadedFileMetadata {
  dimensions?: {
    width?: number;
    height?: number;
  };
  duration?: number;
}

export interface UploadResult {
  id: string;
  url: string;
  name: string;
  type: string;
  size: string;
  assetId: string;
  metadata?: UploadedFileMetadata;
}

export interface FileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StorageProvider {
  uploadFile(file: FileData): Promise<UploadResult>;
}
