import RankBadge from '../profile/RankBadge';
import { motion, AnimatePresence } from 'framer-motion';
export default function MatchmakingScreen({ status, opponentUsername, opponentElo, countdownValue, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <AnimatePresence mode="wait">
        {status === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {/* Animated dots spinner */}
            <div className="flex gap-2 justify-center mb-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'var(--color-primary)' }}
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Finding Opponent...
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Searching for a player near your skill level
            </p>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </motion.div>
        )}

        {status === 'found' && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Opponent Found!
            </h2>
            <div
              className="rounded-xl border p-6 mb-4"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                {opponentUsername}
              </div>
              <RankBadge elo={opponentElo} size="md" />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Get ready...
            </p>
          </motion.div>
        )}

        {status === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownValue}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-7xl font-black"
                style={{
                  color: countdownValue === 0 ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              >
                {countdownValue === 0 ? 'GO!' : countdownValue}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
