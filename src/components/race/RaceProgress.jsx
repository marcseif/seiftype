
export default function RaceProgress({
  localProgress = 0,
  localWPM = 0,
  localUsername = 'You',
  opponentProgress = 0,
  opponentWPM = 0,
  opponentUsername = 'Opponent',
  finished = false,
  winnerId,
  localPlayerId,
}) {
  const localWon = finished && winnerId === localPlayerId;
  const opponentWon = finished && winnerId && winnerId !== localPlayerId;

  return (
    <div className="space-y-4 w-full">
      {/* Local Player */}
      <PlayerProgress
        username={localUsername}
        progress={localProgress}
        wpm={localWPM}
        isLocal
        won={localWon}
        finished={finished}
      />

      {/* Opponent */}
      <PlayerProgress
        username={opponentUsername}
        progress={opponentProgress}
        wpm={opponentWPM}
        won={opponentWon}
        finished={finished}
      />
    </div>
  );
}

function PlayerProgress({ username, progress, wpm, isLocal = false, won, finished }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: isLocal ? 'var(--color-primary)' : 'var(--color-text)' }}
          >
            {username}
          </span>
          {finished && won && <span className="text-xs">👑</span>}
        </div>
        <span className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {Math.round(wpm)} WPM
        </span>
      </div>

      <div className="h-4 rounded-full overflow-hidden relative" style={{ background: 'var(--color-bg)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isLocal
              ? 'var(--color-primary)'
              : 'var(--color-accent)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        {/* Car/cursor indicator at the end of the progress */}
        <motion.div
          className="absolute top-0 h-full w-1 rounded-full"
          style={{
            background: isLocal ? '#fff' : '#ddd',
            left: `${Math.min(99, progress)}%`,
          }}
          animate={{ left: `${Math.min(99, progress)}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="text-[11px] text-right" style={{ color: 'var(--color-text-muted)' }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}
