interface Props {
  accepted: number;
  total?: number;   // default 10, matching Aragon
  minRequired?: number; // default 6
}

/**
 * Top progress bar + "N of 10" counter.
 * Matches the green progress bar shown across all screenshots.
 */
export function ProgressBar({ accepted, total = 10, minRequired = 6 }: Props) {
  const pct = Math.min(100, (accepted / total) * 100);
  const met = accepted >= minRequired;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Track */}
        <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: met ? '#22C55E' : '#F97316',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {/* Minimum marker at 60% */}
        <div style={{
          position: 'absolute',
          left: '60%',
          top: -4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'translateX(-50%)',
        }}>
          <div style={{ width: 1, height: 14, background: '#9CA3AF' }} />
        </div>
      </div>

      {/* Count */}
      <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap', fontWeight: 500 }}>
        <span style={{ color: '#111827', fontWeight: 700 }}>{accepted}</span>
        {' '}of{' '}
        <span style={{ color: '#111827', fontWeight: 700 }}>{total}</span>
      </span>
    </div>
  );
}
