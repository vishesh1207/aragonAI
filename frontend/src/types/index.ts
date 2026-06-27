export type ImageStatus = 'PENDING' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED';

export interface UploadedImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  s3Url?: string;
  status: ImageStatus;
  rejectionReason?: string;
  faceCount?: number;
  blurScore?: number;
  createdAt: string;
  previewUrl?: string; // local blob URL before S3 is ready
}

export interface UploadResult {
  id: string;
  originalName: string;
  status: 'PROCESSING' | 'REJECTED';
  rejectionReason?: string;
}

export interface UploadResponse {
  results: UploadResult[];
}

// Pending file shown in the left sidebar during upload
export interface PendingFile {
  name: string;
  done: boolean;
}
