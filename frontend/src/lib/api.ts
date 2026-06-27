import type { UploadedImage, UploadResponse } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function uploadImages(
  files: File[],
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error ?? 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    xhr.open('POST', `${BASE}/images/upload`);
    xhr.send(form);
  });
}

export async function fetchImages(params: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ images: UploadedImage[]; pagination: { total: number; totalPages: number } }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`${BASE}/images?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

export async function fetchImageById(id: string): Promise<UploadedImage> {
  const res = await fetch(`${BASE}/images/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function deleteImage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/images/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}
