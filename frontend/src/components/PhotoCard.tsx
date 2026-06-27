import { useState } from 'react';
import type { UploadedImage } from '../types';

interface Props {
  image: UploadedImage;
  onDelete?: (id: string) => void;
  showRejectionLabel?: boolean;
}

const REJECTION_DETAIL: Record<string, string> = {
  'Blurry face detected':
    'We detected a blurry face. Please ensure the face is in focus.',
  'Face is too far away':
    'Face is too far from the camera. Please ensure the face is at an appropriate distance.',
  'Too similar to another upload':
    "You've already uploaded images similar to this photo. Our AI suggests uploading a diversity of photos with different backgrounds, lighting, and clothing.",
  'No face detected in the image.':
    'No face was detected. Please upload a photo with a clearly visible face.',
  'Multiple faces detected':
    'Multiple faces were detected. Please upload a photo with only one face.',
  'Resolution too low':
    'The image resolution is too low. Please upload a higher resolution photo (minimum 200×200 px).',
  'File too small':
    'The file is too small. Please upload a larger, higher-quality photo.',
  'Unsupported format':
    'Only JPEG, PNG, and HEIC formats are accepted. Please convert your photo and try again.',
};

function getDetail(reason: string): string {
  for (const [key, detail] of Object.entries(REJECTION_DETAIL)) {
    if (reason.startsWith(key)) return detail;
  }
  return reason;
}

export function PhotoCard({ image, onDelete, showRejectionLabel = false }: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const preview = image.previewUrl ?? image.s3Url;
  const isProcessing = image.status === 'PROCESSING';
  const label = image.rejectionReason ?? '';
  const detail = getDetail(label);
  const isFarAway = label === 'Face is too far away';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete?.(image.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: deleting ? 0.4 : 1 }}>

      {/* ── Image box ── */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#F3F4F6' }}>

        {/* Photo */}
        {preview ? (
          <img src={preview} alt={image.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : isProcessing ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Processing…</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Crop button — only for "face too far away" */}
        {showRejectionLabel && isFarAway && (
          <button style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer',
            zIndex: 1,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <polyline points="6 2 6 6 2 6"/><polyline points="18 2 18 6 22 6"/>
              <polyline points="6 22 6 18 2 18"/><polyline points="18 22 18 18 22 18"/>
            </svg>
            Crop
          </button>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(255,255,255,0.95)',
              border: 'none', borderRadius: '50%',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              zIndex: 2,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Rejection label with tooltip ── */}
      {showRejectionLabel && label && (
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <p
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            style={{
              margin: 0,
              fontSize: 12,
              color: '#374151',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              cursor: 'default',
              lineHeight: 1.3,
              display: 'inline-block',
            }}
          >
            {label}
          </p>

          {tooltipVisible && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1F2937',
              color: '#F9FAFB',
              fontSize: 12,
              lineHeight: 1.5,
              padding: '8px 12px',
              borderRadius: 8,
              width: 210,
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}>
              {detail}
              {/* Arrow */}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1F2937',
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
