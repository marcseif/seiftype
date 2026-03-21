
import { motion, AnimatePresence } from 'framer-motion';


export default function DailyLeaderboard({ results = [], currentUserId }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No results yet today. Be the first!
      </div>
    );
  }

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="space-y-1">
      {/* Header */}
      <div
        className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-3 py-2 text-xs font-semibold"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">WPM</span>
        <span className="text-right">Accuracy</span>
      </div>

      {/* Rows */}
      {results.map((result, index) => {
        const isCurrentUser = result.user_id === currentUserId;
        const user = result.users || {};

        return (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-3 py-2.5 rounded-lg items-center"
            style={{
              background: isCurrentUser ? 'var(--color-highlight)' : index % 2 === 0 ? 'transparent' : 'var(--color-bg)',
              border: isCurrentUser ? '1px solid var(--color-primary)' : '1px solid transparent',
            }}
          >
            {/* Rank */}
            <span
              className="text-sm font-bold"
              style={{ color: index < 3 ? medalColors[index] : 'var(--color-text-secondary)' }}
            >
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
            </span>

            {/* Player */}
            <div className="flex items-center gap-2 min-w-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span
                className="text-sm font-medium truncate"
                style={{ color: isCurrentUser ? 'var(--color-primary)' : 'var(--color-text)' }}
              >
                {user.username || 'Anonymous'}
              </span>
              {user.level && (
                <span className="text-[10px] px-1 rounded" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  Lv.{user.level}
                </span>
              )}
            </div>

            {/* WPM */}
            <span className="text-sm font-bold text-right" style={{ color: 'var(--color-primary)' }}>
              {Math.round(result.wpm)}
            </span>

            {/* Accuracy */}
            <span className="text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
              {result.accuracy.toFixed(1)}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
