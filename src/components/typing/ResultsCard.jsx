import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FiRotateCcw, FiArrowRight, FiShare2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split a keystroke log into per-second WPM buckets. */
function buildWpmBuckets(keystrokeLog) {
  if (!keystrokeLog || keystrokeLog.length === 0) return [];

  const first = keystrokeLog[0].timestamp;
  const buckets = [];
  let correctInBucket = 0;
  let bucketEnd = first + 1000;
  let bucketIndex = 1;

  for (const entry of keystrokeLog) {
    while (entry.timestamp >= bucketEnd) {
      const elapsed = bucketIndex; // seconds elapsed at bucket end
      const wpm = elapsed > 0 ? Math.round((correctInBucket / 5) / (elapsed / 60)) : 0;
      buckets.push({ second: bucketIndex, wpm: Math.max(0, wpm) });
      bucketIndex++;
      bucketEnd += 1000;
    }
    if (entry.correct) correctInBucket++;
  }

  // Final bucket
  const elapsed = bucketIndex;
  const wpm = elapsed > 0 ? Math.round((correctInBucket / 5) / (elapsed / 60)) : 0;
  buckets.push({ second: bucketIndex, wpm: Math.max(0, wpm) });

  return buckets;
}

/** Compute consistency as 100 - coefficient of variation of per-second WPM. */
function computeConsistency(buckets) {
  if (buckets.length < 2) return 100;
  const values = buckets.map((b) => b.wpm);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.round((1 - cv) * 100));
}

// ---------------------------------------------------------------------------
// AnimatedNumber -- count-up animation for big stat numbers
// ---------------------------------------------------------------------------
function AnimatedNumber({ value, duration = 1200, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    const startVal = 0;
    const endVal = value;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display);

  return (
    <span>
      {formatted}{suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Miniature WPM-over-time chart (SVG)
// ---------------------------------------------------------------------------
function WpmChart({ buckets }) {
  if (!buckets || buckets.length === 0) return null;

  return (
    <div className="w-full h-[120px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={1}>
        <AreaChart data={buckets} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorWPM" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
          <XAxis 
            dataKey="second" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            tickFormatter={(value) => `${value}s`}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} 
          />
          <Tooltip 
            contentStyle={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: '12px',
            }}
            itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
            formatter={(value) => [value, 'WPM']}
            labelFormatter={(label) => `Second: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="wpm" 
            stroke="var(--color-primary)" 
            fillOpacity={1} 
            fill="url(#colorWPM)" 
            strokeWidth={2}
            activeDot={{ r: 4, fill: 'var(--color-primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResultsCard
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

/**
 * Post-test results display with animated entrance and count-up stats.
 *
 * Props
 * -----
 * wpm, rawWpm, accuracy, correctChars, incorrectChars, totalChars,
 * duration, mode, contentMode, keystrokeLog,
 * onRestart, onNext
 */
import usePreferencesStore from '../../stores/preferencesStore';

export default function ResultsCard({
  wpm = 0,
  rawWpm = 0,
  accuracy = 100,
  correctChars = 0,
  incorrectChars = 0,
  totalChars = 0,
  duration = 0,
  mode = 'time',
  modeValue = 0,
  contentMode = 'english',
  keystrokeLog = [],
  onRestart,
  onNext,
}) {
  const prefs = usePreferencesStore();
  const buckets = useMemo(() => buildWpmBuckets(keystrokeLog), [keystrokeLog]);
  const consistency = useMemo(() => computeConsistency(buckets), [buckets]);

  // -------------------------------------------------------------------------
  // Keyboard shortcut for restart
  // -------------------------------------------------------------------------
  const tabPressed = useRef(false);

  const handleKeyDown = useCallback(
    (e) => {
      const mode = prefs.restartKey || 'tab_enter';

      if (e.key === 'Tab') {
        if (mode === 'tab' || mode === 'tab_enter') {
          e.preventDefault();
        }
        tabPressed.current = true;
        if (mode === 'tab') {
          onRestart?.();
        }
      }
      if (e.key === 'Enter' && tabPressed.current && mode === 'tab_enter') {
        e.preventDefault();
        onRestart?.();
      }
      if (e.key === 'Escape' || (e.key === 'Escape' && mode === 'esc')) {
        e.preventDefault();
        onRestart?.();
      }
    },
    [onRestart, prefs.restartKey],
  );

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Tab') tabPressed.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // -------------------------------------------------------------------------
  // Share handler
  // -------------------------------------------------------------------------
  const handleShare = useCallback(() => {
    const text = [
      `SeifType Results`,
      `WPM: ${wpm} | Raw: ${rawWpm}`,
      `Accuracy: ${accuracy}%`,
      `Characters: ${correctChars}/${incorrectChars}/${totalChars}`,
      `Duration: ${Math.round(duration)}s`,
      `Consistency: ${consistency}%`,
    ].join('\n');

    navigator.clipboard.writeText(text).catch(() => {});
  }, [wpm, rawWpm, accuracy, correctChars, incorrectChars, totalChars, duration, consistency]);

  // -------------------------------------------------------------------------
  // Formatted duration
  // -------------------------------------------------------------------------
  const durationLabel = duration >= 60
    ? `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`
    : `${Math.round(duration)}s`;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <motion.div
      className="w-full max-w-2xl mx-auto rounded-2xl p-6 shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ----- Headline WPM ----- */}
      <motion.div
        className="text-center mb-6"
        variants={statVariants}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <p
          className="text-sm font-medium uppercase tracking-wider mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Words per Minute
        </p>
        <p
          className="text-6xl font-bold leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          <AnimatedNumber value={wpm} duration={1400} />
        </p>
      </motion.div>

      {/* ----- Stats grid ----- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Raw WPM', value: rawWpm, i: 1 },
          { label: 'Accuracy', value: accuracy, suffix: '%', decimals: 1, i: 2 },
          { label: 'Consistency', value: consistency, suffix: '%', i: 3 },
          { label: 'Characters', text: `${correctChars} / ${incorrectChars} / ${totalChars}`, i: 4 },
          { label: 'Duration', text: durationLabel, i: 5 },
          { 
            label: 'Mode', 
            text: (() => {
              const valStr = mode === 'time' ? `${modeValue}s` : modeValue;
              if (contentMode === 'daily') return 'Daily';
              if (contentMode === 'code') return `Code ${valStr}`;
              if (contentMode === 'quotes') return `Quotes ${valStr}`;
              if (mode === 'words' || mode === 'time') return `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${modeValue}`;
              return `${mode} ${contentMode}`;
            })(),
            subtext: (() => {
              if (contentMode === 'code') return prefs.codeLanguage || 'javascript';
              if (contentMode === 'quotes') return prefs.quoteLength || 'all';
              return null;
            })(),
            i: 6 
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="rounded-xl p-3 text-center flex flex-col justify-center items-center"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            variants={statVariants}
            custom={stat.i}
            initial="hidden"
            animate="visible"
          >
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {stat.label}
            </p>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text)' }}
            >
              {stat.text != null ? (
                stat.text
              ) : (
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix || ''}
                  decimals={stat.decimals || 0}
                />
              )}
            </p>
            {stat.subtext && (
              <p
                className="text-xs mt-1 lowercase"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {stat.subtext}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ----- WPM over time chart ----- */}
      {buckets.length > 1 && (
        <motion.div
          className="mb-6 rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          variants={statVariants}
          custom={7}
          initial="hidden"
          animate="visible"
        >
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            WPM Over Time
          </p>
          <WpmChart buckets={buckets} />
        </motion.div>
      )}

      {/* ----- Action buttons ----- */}
      <motion.div
        className="flex items-center justify-center gap-3"
        variants={statVariants}
        custom={9}
        initial="hidden"
        animate="visible"
      >
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          }}
        >
          <FiRotateCcw size={16} />
          Restart
          <kbd
            className="ml-1 px-1.5 py-0.5 rounded text-xs opacity-70"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          >
            {prefs.restartKey === 'tab' ? 'Tab' : prefs.restartKey === 'esc' ? 'Esc' : 'Tab+Enter'}
          </kbd>
        </button>

        {onNext && (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <FiArrowRight size={16} />
            Next Test
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          title="Copy results to clipboard"
        >
          <FiShare2 size={16} />
          Share
        </button>
      </motion.div>
    </motion.div>
  );
}
