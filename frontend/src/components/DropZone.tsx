import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? '#F97316' : '#D1D5DB'}`,
        borderRadius: 12,
        padding: '28px 20px',
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        background: dragging ? '#FFF7ED' : '#FAFAFA',
        transition: 'all 0.15s',
        marginBottom: 12,
      }}
    >
      <input
        ref={ref}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <button
        onClick={e => { e.stopPropagation(); if (!disabled) ref.current?.click(); }}
        style={{
          background: '#F97316',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: 14,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '0 auto 12px',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload files
      </button>
      <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
        Click to upload or drag and drop
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>
        PNG, JPG, HEIC up to 25MB
      </p>
    </div>
  );
}
