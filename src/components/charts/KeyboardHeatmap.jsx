import { useState } from 'react';

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

function getColor(avgDelay, errorRate) {
  if (!avgDelay && !errorRate) return 'var(--color-border)';
  // Blend from green (fast) to yellow (medium) to red (slow)
  const speed = Math.min(avgDelay / 300, 1); // normalize 0-300ms to 0-1
  const errFactor = Math.min(errorRate / 20, 1);
  const combined = speed * 0.7 + errFactor * 0.3;
  if (combined < 0.33) return '#22c55e';
  if (combined < 0.66) return '#f59e0b';
  return '#ef4444';
}

export default function KeyboardHeatmap({ keyStats = {} }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5" style={{ paddingLeft: ri === 1 ? '20px' : ri === 2 ? '44px' : '0' }}>
          {row.map((key) => {
            const stats = keyStats[key];
            const bg = getColor(stats?.avgDelay, stats?.errorRate);
            return (
              <div
                key={key}
                className="relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-mono font-semibold cursor-pointer transition-transform hover:scale-110 border"
                style={{
                  background: bg,
                  color: stats ? '#fff' : 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                  textShadow: stats ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                }}
                onMouseEnter={() => stats && setTooltip({ key, ...stats })}
                onMouseLeave={() => setTooltip(null)}
              >
                {key.toUpperCase()}
              </div>
            );
          })}
        </div>
      ))}
      {/* Space bar */}
      <div
        className="h-10 rounded-lg border flex items-center justify-center text-xs font-mono mt-1"
        style={{
          width: '280px',
          background: getColor(keyStats[' ']?.avgDelay, keyStats[' ']?.errorRate),
          color: 'var(--color-text-muted)',
          borderColor: 'var(--color-border)',
        }}
      >
        SPACE
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="mt-2 px-3 py-2 rounded-lg text-xs border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <span className="font-bold">{tooltip.key.toUpperCase()}</span>
          {' — '}Avg: {Math.round(tooltip.avgDelay || 0)}ms | Errors: {(tooltip.errorRate || 0).toFixed(1)}%
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#22c55e' }} /> Fast</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} /> Medium</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#ef4444' }} /> Slow</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: 'var(--color-border)' }} /> No data</div>
      </div>
    </div>
  );
}
