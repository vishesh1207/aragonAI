import { useState } from 'react';
import type { UploadedImage } from '../types';
import { PhotoCard } from './PhotoCard';

interface Props {
  title: string;
  subtitle: string;
  images: UploadedImage[];
  type: 'accepted' | 'rejected';
  onDelete?: (id: string) => void;
}

export function PhotoSection({ title, subtitle, images, type, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (images.length === 0) return null;

  const isAccepted = type === 'accepted';

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Section header — collapsible */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#fff',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          borderBottom: collapsed ? 'none' : '1px solid #F3F4F6',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAccepted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
              </svg>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</span>
          </div>
          <p style={{ margin: '4px 0 0 26px', fontSize: 13, color: '#6B7280' }}>{subtitle}</p>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 2 }}
        >
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      {!collapsed && (
        <div style={{
          padding: '16px 20px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 12,
          background: '#fff',
        }}>
          {images.map(img => (
            <PhotoCard
              key={img.id}
              image={img}
              onDelete={onDelete}
              showRejectionLabel={!isAccepted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
