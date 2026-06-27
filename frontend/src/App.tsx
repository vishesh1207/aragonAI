import { useState } from 'react';
import { DropZone }        from './components/DropZone';
import { UploadingButton } from './components/UploadingButton';
import { PendingFileList } from './components/PendingFileList';
import { PhotoSection }    from './components/PhotoSection';
import { CheckingSection } from './components/CheckingSection';
import { ProgressBar }     from './components/ProgressBar';
import { Toast }           from './components/Toast';
import { useImageUpload }  from './hooks/useImageUpload';

const MIN_REQUIRED = 6;
const MAX_PHOTOS   = 10;

const REQUIREMENTS = [
  'Clearly visible, centered face',
  'Well-lit and in sharp focus',
  'Solo portrait — just you',
  'Mix of close-ups, selfies, and mid-range shots',
];

const RESTRICTIONS = [
  'No sunglasses, hats, or face coverings',
  'No heavy filters or Snapchat effects',
  'No group photos — solo portraits only',
  'Avoid full-body shots where face is very small',
];

export default function App() {
  const { accepted, rejected, loading, uploadState, handleFiles, handleDelete } = useImageUpload();

  const [reqOpen,  setReqOpen]  = useState(false);
  const [restOpen, setRestOpen] = useState(false);

  const isUploading = uploadState.phase === 'uploading';
  const isChecking  = uploadState.phase === 'checking';
  const isError     = uploadState.phase === 'error';
  const showToast   = uploadState.phase === 'done';

  const acceptedImages = accepted.filter(i => i.status === 'ACCEPTED');
  const checkingImages = accepted.filter(i => i.status === 'PROCESSING');

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top header bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 24px', height: 52,
        borderBottom: '1px solid #F3F4F6', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          <div style={{
            width: 28, height: 28, background: '#F97316', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Aragon.ai</span>
        </div>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 'auto' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Two-panel body */}
      <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* ── Left sidebar ── */}
        <div style={{
          width: 300, flexShrink: 0,
          borderRight: '1px solid #F3F4F6',
          padding: '24px 20px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 13, cursor: 'pointer', color: '#374151',
            marginBottom: 24, width: 'fit-content',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div style={{ marginBottom: 8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>

          <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
            Upload photos
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Now the fun begins! Select at least <strong>6 of your best photos.</strong>{' '}
            Uploading <strong>a mix of close-ups, selfies and mid-range shots</strong>{' '}
            can help the AI better capture your face and body type.
          </p>

          {/* Fix #8 — show UploadingButton only while XHR is in flight; re-enable DropZone during checking */}
          {isUploading
            ? <UploadingButton />
            : <DropZone onFiles={handleFiles} />
          }

          {uploadState.pendingFiles.length > 0 && (
            <PendingFileList files={uploadState.pendingFiles} />
          )}

          {/* Fix #6 — error state */}
          {isError && (
            <div style={{
              marginTop: 12, padding: '12px 14px',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, fontSize: 13, color: '#991B1B',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
              </svg>
              <span>{uploadState.errorMessage ?? 'Upload failed. Please try again.'}</span>
            </div>
          )}
        </div>

        {/* ── Right content panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Uploaded Images</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{MIN_REQUIRED}</span>
              </div>
            </div>
            <ProgressBar accepted={acceptedImages.length} total={MAX_PHOTOS} minRequired={MIN_REQUIRED} />
          </div>

          {/* Fix #7 — initial loading spinner */}
          {loading && acceptedImages.length === 0 && rejected.length === 0 && checkingImages.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: '#9CA3AF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5"
                style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 14 }}>Loading your photos…</span>
            </div>
          )}

          <CheckingSection images={checkingImages} onDelete={handleDelete} />

          {acceptedImages.length > 0 && (
            <PhotoSection
              title="Accepted Photos"
              subtitle="These images passed our scoring test and will all be used to generate your AI photos."
              images={acceptedImages}
              type="accepted"
              onDelete={handleDelete}
            />
          )}

          {rejected.length > 0 && (
            <PhotoSection
              title="Some Photos Didn't Meet Our Guidelines"
              subtitle={`You can move to the next step as you've uploaded ${acceptedImages.length} good photo${acceptedImages.length !== 1 ? 's' : ''}. Replacing these is optional.`}
              images={rejected}
              type="rejected"
              onDelete={handleDelete}
            />
          )}

          {/* Photo Requirements & Restrictions — always visible */}
          <div style={{ marginTop: 16 }}>

            {/* Photo Requirements accordion */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setReqOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '14px 20px',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Photo Requirements</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"
                  style={{ transform: reqOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {reqOpen && (
                <ul style={{ margin: 0, padding: '0 20px 16px 20px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {REQUIREMENTS.map(r => (
                    <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Photo Restrictions accordion */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setRestOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '14px 20px',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Photo Restrictions</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"
                  style={{ transform: restOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {restOpen && (
                <ul style={{ margin: 0, padding: '0 20px 16px 20px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {RESTRICTIONS.map(r => (
                    <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast show={showToast} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
      `}</style>
    </div>
  );
}
