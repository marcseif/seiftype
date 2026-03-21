import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../data/achievements';

export default function BadgeShowcase({ achievements = [] }) {
  const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));

  return (
    <div className="space-y-6">
      {ACHIEVEMENT_CATEGORIES.map((cat) => {
        const categoryAchievements = Object.values(ACHIEVEMENTS).filter(
          (a) => a.category === cat.key
        );
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={cat.key}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <span>{cat.icon}</span> {cat.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categoryAchievements.map((achievement) => {
                const unlocked = unlockedKeys.has(achievement.key);
                const unlockData = achievements.find((a) => a.achievement_key === achievement.key);

                return (
                  <div
                    key={achievement.key}
                    className="rounded-lg border p-3 transition-all"
                    style={{
                      background: unlocked ? 'var(--color-surface)' : 'var(--color-bg)',
                      borderColor: unlocked ? 'var(--color-primary)' + '44' : 'var(--color-border)',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div className="text-2xl mb-1">{unlocked ? achievement.icon : '🔒'}</div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: unlocked ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                    >
                      {achievement.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {achievement.description}
                    </div>
                    {unlocked && unlockData && (
                      <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(unlockData.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
