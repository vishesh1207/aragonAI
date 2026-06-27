const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface FileValidationError {
  file: File;
  reason: string;
}

/**
 * Validate files client-side before sending to the server.
 * Returns { valid: File[], invalid: FileValidationError[] }.
 */
export function validateFilesClientSide(files: File[]): {
  valid: File[];
  invalid: FileValidationError[];
} {
  const valid: File[] = [];
  const invalid: FileValidationError[] = [];

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeOk = ALLOWED_MIMES.includes(file.type);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);

    if (!mimeOk && !extOk) {
      invalid.push({ file, reason: `Unsupported format "${ext}". Use JPEG, PNG, or HEIC.` });
    } else if (file.size > MAX_FILE_SIZE) {
      invalid.push({ file, reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.` });
    } else {
      valid.push(file);
    }
  }

  return { valid, invalid };
}

/**
 * Generate a local preview URL for a File.
 * Must be revoked when no longer needed.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
