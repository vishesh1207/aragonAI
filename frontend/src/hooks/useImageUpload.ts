import { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage, PendingFile } from '../types';
import { uploadImages, fetchImages, deleteImage } from '../lib/api';
import { validateFilesClientSide, createPreviewUrl } from '../lib/validation';

export type UploadPhase = 'idle' | 'uploading' | 'checking' | 'done' | 'error';

export interface UploadState {
  phase: UploadPhase;
  progress: number;
  errorMessage?: string;
  pendingFiles: PendingFile[];
}

export function useImageUpload() {
  const [accepted, setAccepted]   = useState<UploadedImage[]>([]);
  const [rejected, setRejected]   = useState<UploadedImage[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    phase: 'idle', progress: 0, pendingFiles: [],
  });

  // Preview URLs keyed by upload result id
  const previewMap = useRef<Map<string, string>>(new Map());

  useEffect(() => { loadImages(); }, []);

  // Poll for PROCESSING → final status transitions every 2s
  useEffect(() => {
    if (processing.size === 0) return;
    const timer = setInterval(pollProcessing, 2000);
    return () => clearInterval(timer);
  }, [processing]);

  async function loadImages() {
    setLoading(true);
    try {
      const [acc, rej] = await Promise.all([
        fetchImages({ status: 'ACCEPTED' }),
        fetchImages({ status: 'REJECTED' }),
      ]);

      // Preserve local preview URLs — server responses never carry them.
      // Also keep still-PROCESSING items so they don't vanish mid-poll when
      // a sibling item finishes and triggers loadImages().
      setAccepted(prev => {
        const prevPreviews = new Map(prev.map(i => [i.id, i.previewUrl]));
        const newAccepted = acc.images.map(img => ({
          ...img,
          previewUrl: previewMap.current.get(img.id) ?? prevPreviews.get(img.id),
        }));
        const acceptedIds = new Set(newAccepted.map(i => i.id));
        const stillProcessing = prev.filter(
          i => i.status === 'PROCESSING' && !acceptedIds.has(i.id)
        );
        return [...stillProcessing, ...newAccepted];
      });

      setRejected(prev => {
        // Keep client-side-only rejected items (never sent to server)
        const localOnly = prev.filter(i => i.id.startsWith('local-'));
        const prevPreviews = new Map(prev.map(i => [i.id, i.previewUrl]));
        const serverRejected = rej.images.map(img => ({
          ...img,
          previewUrl: previewMap.current.get(img.id) ?? prevPreviews.get(img.id),
        }));
        return [...localOnly, ...serverRejected];
      });
    } catch (e) { console.error('loadImages', e); }
    finally { setLoading(false); }
  }

  async function pollProcessing() {
    try {
      const { images } = await fetchImages({ status: 'PROCESSING' });
      const stillProcessingIds = new Set(images.map(i => i.id));

      const finished = [...processing].filter(id => !stillProcessingIds.has(id));
      if (finished.length > 0) {
        // Re-fetch to get final status of finished items
        await loadImages();
      }
      setProcessing(stillProcessingIds);
    } catch (e) { console.error('poll', e); }
  }

  const handleFiles = useCallback(async (rawFiles: File[]) => {
    const { valid, invalid } = validateFilesClientSide(rawFiles);

    // Immediate client-side rejects
    if (invalid.length > 0) {
      const immediate: UploadedImage[] = invalid.map(({ file, reason }) => ({
        id: `local-${Date.now()}-${Math.random()}`,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        status: 'REJECTED',
        rejectionReason: reason,
        createdAt: new Date().toISOString(),
        previewUrl: createPreviewUrl(file),
      }));
      setRejected(prev => [...immediate, ...prev]);
    }

    if (valid.length === 0) return;

    // Build pending file list for sidebar display
    const pendingFiles: PendingFile[] = valid.map(f => ({ name: f.name, done: false }));
    setUploadState({ phase: 'uploading', progress: 0, pendingFiles });

    // Pre-create preview URLs for valid files
    const previews = valid.map(f => createPreviewUrl(f));

    try {
      const response = await uploadImages(valid, (pct) => {
        // Mark files as done progressively based on progress
        const doneCount = Math.floor((pct / 100) * valid.length);
        setUploadState(s => ({
          ...s,
          progress: pct,
          pendingFiles: s.pendingFiles.map((f, i) => ({ ...f, done: i < doneCount })),
        }));
      });

      // Switch to "checking" phase (mirrors "Hang tight" screen)
      setUploadState(s => ({
        ...s,
        phase: 'checking',
        pendingFiles: s.pendingFiles.map(f => ({ ...f, done: true })),
      }));

      const newProcessing = new Set<string>();
      const immediateRejected: UploadedImage[] = [];
      const immediateChecking: UploadedImage[] = [];

      response.results.forEach((result, idx) => {
        const preview = previews[idx];
        if (result.status === 'REJECTED') {
          previewMap.current.set(result.id, preview);
          immediateRejected.push({
            id: result.id,
            originalName: result.originalName,
            mimeType: valid[idx]?.type ?? '',
            sizeBytes: valid[idx]?.size ?? 0,
            status: 'REJECTED',
            rejectionReason: result.rejectionReason,
            createdAt: new Date().toISOString(),
            previewUrl: preview,
          });
        } else {
          // PROCESSING — show in "checking" grid
          newProcessing.add(result.id);
          previewMap.current.set(result.id, preview);
          immediateChecking.push({
            id: result.id,
            originalName: result.originalName,
            mimeType: valid[idx]?.type ?? '',
            sizeBytes: valid[idx]?.size ?? 0,
            status: 'PROCESSING',
            createdAt: new Date().toISOString(),
            previewUrl: preview,
          });
        }
      });

      if (immediateRejected.length > 0) setRejected(prev => [...immediateRejected, ...prev]);
      // Show processing items in accepted area temporarily
      if (immediateChecking.length > 0) {
        setAccepted(prev => [...immediateChecking, ...prev]);
      }
      if (newProcessing.size > 0) setProcessing(prev => new Set([...prev, ...newProcessing]));

      // Transition to done (shows toast)
      setTimeout(() => setUploadState({ phase: 'done', progress: 100, pendingFiles: [] }), 800);
      setTimeout(() => setUploadState({ phase: 'idle', progress: 0,  pendingFiles: [] }), 4000);

    } catch (err) {
      previews.forEach(URL.revokeObjectURL);
      setUploadState({
        phase: 'error',
        progress: 0,
        pendingFiles: [],
        errorMessage: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteImage(id);
      setAccepted(prev  => prev.filter(i => i.id !== id));
      setRejected(prev  => prev.filter(i => i.id !== id));
      setProcessing(prev => { const n = new Set(prev); n.delete(id); return n; });
      const url = previewMap.current.get(id);
      if (url) { URL.revokeObjectURL(url); previewMap.current.delete(id); }
    } catch (e) { console.error('delete', e); }
  }, []);

  // Merge updated accepted images with their local preview URLs
  const acceptedWithPreviews = accepted.map(img => ({
    ...img,
    previewUrl: img.previewUrl ?? previewMap.current.get(img.id),
  }));

  return {
    accepted: acceptedWithPreviews,
    rejected,
    processing,
    loading,
    uploadState,
    handleFiles,
    handleDelete,
  };
}
