import { getRankTier, getRankProgress } from '../../lib/elo';

export default function RankBadge({ elo, size = 'md', showProgress = true }) {
  const rank = getRankTier(elo || 1000);
  const progress = getRankProgress(elo || 1000);

  const sizes = {
    sm: { icon: 'text-sm', text: 'text-xs', elo: 'text-[10px]', bar: 'h-1' },
    md: { icon: 'text-lg', text: 'text-sm', elo: 'text-xs', bar: 'h-1.5' },
    lg: { icon: 'text-2xl', text: 'text-base', elo: 'text-sm', bar: 'h-2' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-2">
      <span className={s.icon}>{rank.icon}</span>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${s.text}`} style={{ color: rank.color }}>
            {rank.name}
          </span>
          <span className={s.elo} style={{ color: 'var(--color-text-secondary)' }}>
            {elo || 1000}
          </span>
        </div>
        {showProgress && (
          <div
            className={`w-20 ${s.bar} rounded-full overflow-hidden mt-0.5`}
            style={{ background: 'var(--color-border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: rank.color }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
