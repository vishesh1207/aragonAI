import type { UploadedImage } from '../types';
import { PhotoCard } from './PhotoCard';

interface Props {
  images: UploadedImage[];
  onDelete?: (id: string) => void;
}

/**
 * "Hang tight — we're checking your photos" section shown during server validation.
 * Matches screenshot 3.
 */
export function CheckingSection({ images, onDelete }: Props) {
  if (!images.length) return null;

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Hang tight — we're checking your photos
          </h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
          You're almost there! We're just verifying the quality of your uploads to make sure you get the best results.
        </p>
      </div>
      <div style={{
        padding: '16px 20px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
        gap: 12,
        background: '#fff',
      }}>
        {images.map(img => (
          <PhotoCard key={img.id} image={img} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
