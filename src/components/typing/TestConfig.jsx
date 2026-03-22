import { useState } from 'react';
import usePreferencesStore from '../../stores/preferencesStore';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Config data
// ---------------------------------------------------------------------------

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

const CONTENT_MODES = [
  { value: 'random', label: 'Words' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'code', label: 'Code' },
  { value: 'custom', label: 'Custom' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'english_1k', label: 'English 1k' },
  { value: 'english_5k', label: 'English 5k' },
];

const QUOTE_LENGTH_OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const CODE_LANG_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

// ---------------------------------------------------------------------------
// Reusable pill button
// ---------------------------------------------------------------------------

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap"
      style={{
        backgroundColor: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.color = 'var(--color-text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sub-option panel (slides open for the active content mode)
// ---------------------------------------------------------------------------

const panelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

function SubOptions({ contentMode }) {
  const {
    contentSubmode, setContentSubmode,
    quoteLength, setQuoteLength,
    codeLanguage, setCodeLanguage,
  } = usePreferencesStore();

  // Local state for custom text
  const [customText, setCustomText] = useState('');

  switch (contentMode) {
    case 'random':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium mr-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Difficulty
          </span>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={contentSubmode === opt.value}
              onClick={() => setContentSubmode(opt.value)}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      );

    case 'quotes':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium mr-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Length
          </span>
          {QUOTE_LENGTH_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={quoteLength === opt.value}
              onClick={() => setQuoteLength(opt.value)}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      );

    case 'code':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium mr-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Language
          </span>
          {CODE_LANG_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={codeLanguage === opt.value}
              onClick={() => setCodeLanguage(opt.value)}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      );

    case 'custom':
      return (
        <div className="flex flex-col gap-2 w-full">
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Paste your text
          </span>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste or type the text you want to practice..."
            rows={3}
            className="px-3 py-2 rounded-lg text-xs font-medium outline-none transition-colors resize-y focus:ring-1"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              ringColor: 'var(--color-primary)',
              width: '100%',
              minHeight: 60,
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// TestConfig
// ---------------------------------------------------------------------------

/**
 * TestConfig -- test mode configuration bar displayed above the typing area.
 *
 * Reads and writes directly to the preferences Zustand store so the rest
 * of the app can react to setting changes.
 */
export default function TestConfig() {
  const {
    testMode, setTestMode,
    testModeValue, setTestModeValue,
    contentMode, setContentMode,
  } = usePreferencesStore();

  const timeValues = TIME_OPTIONS;
  const wordValues = WORD_OPTIONS;

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-xl p-3 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Row 1: test mode (time / words) with value selectors */}
      <div className="flex items-center gap-3 flex-wrap min-h-[40px]">
        {/* Mode toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden shrink-0"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => {
              setTestMode('time');
              // Default to 30s if switching to time and current value isn't valid
              if (!TIME_OPTIONS.includes(testModeValue)) setTestModeValue(30);
            }}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              backgroundColor: testMode === 'time' ? 'var(--color-primary)' : 'transparent',
              color: testMode === 'time' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Time
          </button>
          <button
            onClick={() => {
              setTestMode('words');
              if (!WORD_OPTIONS.includes(testModeValue)) setTestModeValue(25);
            }}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              backgroundColor: testMode === 'words' ? 'var(--color-primary)' : 'transparent',
              color: testMode === 'words' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Words
          </button>
        </div>

        {/* Separator */}
        <div
          className="w-px h-5 hidden lg:block"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {/* Value pills */}
        <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
          {(testMode === 'time' ? timeValues : wordValues).map((val) => (
            <Pill
              key={val}
              active={testModeValue === val}
              onClick={() => setTestModeValue(val)}
            >
              {testMode === 'time' ? `${val}s` : val}
            </Pill>
          ))}
        </div>

        {/* Separator */}
        <div
          className="w-px h-5 hidden lg:block"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {/* Content mode pills */}
        <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
          {CONTENT_MODES.map((cm) => (
            <Pill
              key={cm.value}
              active={contentMode === cm.value}
              onClick={() => setContentMode(cm.value)}
            >
              {cm.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Row 2: Sub-options for the active content mode (absolute positioning helper to prevent jumping) */}
      <div className="relative min-h-[36px] w-full">
        <div className="absolute inset-0 flex items-center w-full">
          <SubOptions contentMode={contentMode} />
        </div>
      </div>
    </div>
  );
}
