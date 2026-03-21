export default function StreakDisplay({ streak = 0, freezeCount = 0 }) {
  return (
    <div className="flex items-center gap-4">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <div
          className="relative text-2xl"
          style={{
            filter: streak > 7 ? 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))' : 'none',
          }}
        >
          {streak > 0 ? '🔥' : '💤'}
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: streak > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
            {streak}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>day streak</div>
        </div>
      </div>

      {/* Freeze */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">❄️</span>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            {freezeCount}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {freezeCount === 1 ? 'freeze' : 'freezes'}
          </div>
        </div>
      </div>
    </div>
  );
}
