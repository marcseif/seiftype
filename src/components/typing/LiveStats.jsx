
/**
 * LiveStats -- compact horizontal display of WPM, accuracy, and timer shown
 * above the typing area while a test is in progress.
 *
 * Props
 * -----
 * wpm       : number
 * accuracy  : number (0-100)
 * timeLeft  : number (seconds, used in time mode)
 * elapsed   : number (seconds, used in words mode)
 * mode      : 'time' | 'words'
 * isActive  : boolean -- true while the test is running
 */

import { motion, AnimatePresence } from 'framer-motion';
import usePreferencesStore from '../../stores/preferencesStore';

export default function LiveStats({
  wpm = 0,
  accuracy = 100,
  timeLeft = 0,
  elapsed = 0,
  mode = 'time',
  isActive = false,
}) {
  const showLiveWPM = usePreferencesStore((state) => state.showLiveWPM);
  const showLiveAccuracy = usePreferencesStore((state) => state.showLiveAccuracy);

  // Format timer value depending on mode
  const timerValue = mode === 'time' ? Math.ceil(timeLeft) : Math.floor(elapsed);
  const timerLabel = mode === 'time' ? 'remaining' : 'elapsed';

  // Format as mm:ss if >= 60s
  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = String(seconds % 60).padStart(2, '0');
      return `${m}:${s}`;
    }
    return `${seconds}`;
  };

  return (
    <div className="h-12 w-full flex items-center justify-center">
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="flex items-center justify-center gap-8 py-2 w-full"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
          {/* WPM */}
          {showLiveWPM && (
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--color-primary)', transition: 'color 0.15s ease' }}
              >
                {wpm}
              </span>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                wpm
              </span>
            </div>
          )}

          {/* Accuracy */}
          {showLiveAccuracy && (
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{
                  color:
                    accuracy >= 97
                      ? 'var(--color-correct)'
                      : accuracy >= 90
                        ? 'var(--color-warning)'
                        : 'var(--color-incorrect)',
                  transition: 'color 0.15s ease'
                }}
              >
                {accuracy.toFixed(1)}%
              </span>

              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                acc
              </span>
            </div>
          )}

          {/* Timer */}
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={timerValue}
              className="text-2xl font-bold tabular-nums"
              style={{ color: 'var(--color-text)' }}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {formatTime(timerValue)}
            </motion.span>
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {timerLabel}
            </span>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
