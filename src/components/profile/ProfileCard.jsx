import { getRankTier, getRankProgress } from '../../lib/elo';
import { getLevelProgress } from '../../lib/metrics';

export default function ProfileCard({ profile, stats }) {
  if (!profile) return null;

  const rank = getRankTier(profile.elo || 1000);
  const levelProgress = getLevelProgress(profile.xp || 0);
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full border-2" style={{ borderColor: rank.color }} />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2"
            style={{ background: 'var(--color-primary)', color: '#fff', borderColor: rank.color }}
          >
            {profile.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {profile.username}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: rank.color + '22', color: rank.color }}
            >
              {rank.icon} {rank.name}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--color-primary)' + '22', color: 'var(--color-primary)' }}
            >
              Lv. {profile.level || 1}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Joined {joinDate}
          </p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          <span>Level {profile.level || 1}</span>
          <span>{Math.round(levelProgress * 100)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${levelProgress * 100}%`, background: 'var(--color-primary)' }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Tests" value={profile.tests_completed || 0} />
        <StatBox label="Best WPM" value={stats?.bestWPM || 0} />
        <StatBox label="Avg Accuracy" value={`${stats?.avgAccuracy || 0}%`} />
        <StatBox
          label="Streak"
          value={
            <span className="flex items-center justify-center gap-1">
              {profile.streak || 0}
              {(profile.streak || 0) > 0 && <span className="text-orange-400">🔥</span>}
            </span>
          }
        />
      </div>

      {/* ELO / Rank Progress */}
      <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: rank.color }}>{rank.name}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{profile.elo || 1000} ELO</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${getRankProgress(profile.elo || 1000)}%`, background: rank.color }}
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--color-bg)' }}>
      <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{value}</div>
      <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}
