import type { PendingFile } from '../types';

interface Props {
  files: PendingFile[];
}

/** Left-sidebar file list shown during upload — matches screenshot 2 */
export function PendingFileList({ files }: Props) {
  if (!files.length) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6B7280' }}>
        It can take up to 1 minute to upload
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {files.map((f, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            background: '#F9FAFB',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
          }}>
            {/* image thumbnail placeholder */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: '#E5E7EB',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <span style={{
              fontSize: 12,
              color: '#374151',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {f.name}
            </span>
            {f.done ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5"
                style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
