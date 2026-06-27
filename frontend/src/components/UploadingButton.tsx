/**
 * Shown in place of the DropZone while files are being sent to the server.
 * Matches the "Uploading..." button state in screenshots 2 & 3.
 */
export function UploadingButton() {
  return (
    <div style={{
      border: '2px dashed #D1D5DB',
      borderRadius: 12,
      padding: '28px 20px',
      textAlign: 'center',
      background: '#FAFAFA',
      marginBottom: 12,
    }}>
      <button disabled style={{
        background: '#F97316',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 auto 12px',
        opacity: 0.9,
        cursor: 'default',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        Uploading...
      </button>
      <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
        Click to upload or drag and drop
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>PNG, JPG, HEIC up to 120MB</p>
    </div>
  );
}
