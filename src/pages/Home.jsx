/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import useTypingEngine from '../hooks/useTypingEngine';
import useSound from '../hooks/useSound';
import useAchievements from '../hooks/useAchievements';
import usePreferencesStore from '../stores/preferencesStore';
import useUserStore from '../stores/userStore';

// Components
import TestConfig from '../components/typing/TestConfig';
import TypingDisplay from '../components/typing/TypingDisplay';
import LiveStats from '../components/typing/LiveStats';
import ResultsCard from '../components/typing/ResultsCard';
import VirtualKeyboard from '../components/typing/VirtualKeyboard';
import { SkeletonText } from '../components/ui/LoadingSkeleton';

// Data & utilities
import {
  getRandomWords,
  getTimedWords,
  getRandomQuote,
  getRandomCodeSnippet,
} from '../data/words';
import { saveTestResult, upsertBigrams } from '../lib/supabase';
import { calculateXP, extractBigrams } from '../lib/metrics';
import { toastAchievement, toastXP } from '../components/ui/Toast';

// ---------------------------------------------------------------------------
// Fallback texts for modes that require external input
// ---------------------------------------------------------------------------

const DEFAULT_CUSTOM_TEXT =
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const configVariants = {
  hidden: { opacity: 0, y: -12, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    marginBottom: 24,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const typingAreaVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const resultsVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ---------------------------------------------------------------------------
// Home page component
// ---------------------------------------------------------------------------

export default function Home() {
  // ---- Preferences store ----
  const testMode = usePreferencesStore((s) => s.testMode);
  const testModeValue = usePreferencesStore((s) => s.testModeValue);
  const contentMode = usePreferencesStore((s) => s.contentMode);
  const contentSubmode = usePreferencesStore((s) => s.contentSubmode);
  const quoteLength = usePreferencesStore((s) => s.quoteLength);
  const codeLanguage = usePreferencesStore((s) => s.codeLanguage);
  const font = usePreferencesStore((s) => s.font);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const caretStyle = usePreferencesStore((s) => s.caretStyle);
  const smoothCaret = usePreferencesStore((s) => s.smoothCaret);
  const showVirtualKeyboard = usePreferencesStore((s) => s.showVirtualKeyboard);

  // ---- User store ----
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const addXP = useUserStore((s) => s.addXP);
  const updateUserProfile = useUserStore((s) => s.updateUserProfile);

  // ---- Local state ----
  const [passage, setPassage] = useState('');
  const [customText, _setCustomText] = useState(DEFAULT_CUSTOM_TEXT);
  const [loading, _setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);
  const [regenCounter, setRegenCounter] = useState(0);

  // ---- Refs ----
  const containerRef = useRef(null);
  const tabPressedRef = useRef(false);

  // ---- Sound hook ----
  const { playKeystroke, playError, playComplete } = useSound();

  // ---- Achievements hook ----
  const { checkAndUnlock } = useAchievements();

  // ---------------------------------------------------------------------------
  // Test completion handler
  // ---------------------------------------------------------------------------
  const handleTestComplete = useCallback(
    async (result) => {
      playComplete();
      setCompletedResult(result);

      if (!user?.id) return;

      try {
        // Build the test result row for Supabase
        const prefs = usePreferencesStore.getState();
        const testResult = {
          user_id: user.id,
          wpm: result.wpm,
          accuracy: result.accuracy,
          mode: prefs.testMode,
          mode_value: prefs.testModeValue,
          content_mode: prefs.contentMode,
          content_submode: prefs.contentSubmode,
          duration_seconds: Math.round(result.elapsed),
          correct_chars: result.correctChars,
          incorrect_chars: result.incorrectChars,
          char_count: result.totalChars,
          keystroke_data: result.keystrokeLog,
        };

        await saveTestResult(testResult);

        // Calculate XP and update user store
        const xp = calculateXP(result.wpm, result.accuracy, result.elapsed);
        const wpmXP = Math.floor(xp * 0.7);
        const accXP = xp - wpmXP;
        addXP(xp);
        toastXP(xp, { wpmXP, accXP });

        // Persist XP and test count to Supabase
        if (profile) {
          updateUserProfile({
            tests_completed: (profile.tests_completed || 0) + 1,
            xp: (profile.xp || 0) + xp,
          });
        }

        // Check achievements
        const achievementStats = {
          bestWPM: Math.max(result.wpm, profile?.best_wpm || 0),
          totalTests: (profile?.tests_completed || 0) + 1,
          modesPlayed: [prefs.contentMode],
          learnCompleted: 0,
          codeCompleted: prefs.contentMode === 'code' ? 1 : 0,
          racesWon: 0,
          winStreak: 0,
        };

        const achievementResult = {
          ...result,
          created_at: new Date().toISOString(),
        };

        const newAchievements = await checkAndUnlock(
          achievementStats,
          achievementResult,
          []
        );

        if (newAchievements && newAchievements.length > 0) {
          newAchievements.forEach((a) => {
            toastAchievement(a.name, a.icon);
          });
        }

        // Extract bigrams and save to Supabase
        const bigrams = extractBigrams(result.keystrokeLog);
        if (bigrams.length > 0) {
          await upsertBigrams(user.id, bigrams);
        }
      } catch (err) {
        console.error('Error processing test completion:', err);
      }
    },
    [user, profile, playComplete, addXP, updateUserProfile, checkAndUnlock]
  );

  // ---------------------------------------------------------------------------
  // Typing engine
  // ---------------------------------------------------------------------------
  const engine = useTypingEngine(
    passage,
    testMode,
    testModeValue,
    handleTestComplete
  );

  // ---------------------------------------------------------------------------
  // Passage generation
  //
  // Runs on mount, when test config changes, and when regenCounter increments
  // (which happens on explicit restart).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function generate() {
      switch (contentMode) {
        case 'random': {
          const words =
            testMode === 'time'
              ? getTimedWords(testModeValue, contentSubmode)
              : getRandomWords(testModeValue, contentSubmode);
          setPassage(words.join(' '));
          break;
        }

        case 'quotes': {
          const quote = getRandomQuote(quoteLength);
          setPassage(quote.text);
          break;
        }

        case 'code': {
          const snippet = getRandomCodeSnippet(codeLanguage);
          // Normalise whitespace so the typing engine can split on spaces.
          // Newlines become single spaces; consecutive spaces collapse.
          setPassage(
            snippet
              .replace(/\n+/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          );
          break;
        }

        case 'custom': {
          setPassage(customText || DEFAULT_CUSTOM_TEXT);
          break;
        }

        default: {
          setPassage(getRandomWords(25, 'easy').join(' '));
        }
      }
    }

    setCompletedResult(null);
    generate();
  }, [
    contentMode,
    testMode,
    testModeValue,
    contentSubmode,
    quoteLength,
    codeLanguage,
    customText,
    regenCounter,
  ]);

  // ---------------------------------------------------------------------------
  // Handle custom text changes (from TestConfig or local input)
  // ---------------------------------------------------------------------------
  const _onCustomTextChange = useCallback((text) => {
    _setCustomText(text);
  }, []);

  // ---------------------------------------------------------------------------
  // Restart / Next test
  // ---------------------------------------------------------------------------
  const handleRestart = useCallback(() => {
    setCompletedResult(null);

    const state = usePreferencesStore.getState();

    // For custom mode the text stays the same -- just restart the engine.
    // For all other modes, bump the regen counter to produce a new passage.
    if (state.contentMode === 'custom') {
      engine.restart();
    } else {
      setRegenCounter((c) => c + 1);
    }

    // Restore focus to the typing container
    setTimeout(() => {
      containerRef.current?.focus();
    }, 80);
  }, [engine]);

  const handleNextTest = useCallback(() => {
    setCompletedResult(null);
    setRegenCounter((c) => c + 1);
    setTimeout(() => {
      containerRef.current?.focus();
    }, 80);
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard shortcut: Tab+Enter, Tab, or Escape to restart
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const prefs = usePreferencesStore.getState();
      const restartKeyMode = prefs.restartKey || 'tab_enter';

      if (e.key === 'Tab') {
        // Prevent Tab from moving browser focus during a test
        if (engine.isActive || engine.isFinished) {
          e.preventDefault();
        }
        tabPressedRef.current = true;
        if (restartKeyMode === 'tab') {
          e.preventDefault();
          handleRestart();
        }
      }

      if (e.key === 'Enter' && tabPressedRef.current && restartKeyMode === 'tab_enter') {
        e.preventDefault();
        handleRestart();
      }

      if (e.key === 'Escape' || (e.key === 'Escape' && restartKeyMode === 'esc')) {
        e.preventDefault();
        handleRestart();
      }
    };

    const handleGlobalKeyUp = (e) => {
      if (e.key === 'Tab') {
        tabPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [engine.isActive, engine.isFinished, handleRestart]);

  // ---------------------------------------------------------------------------
  // Container keydown handler -- sounds + engine delegation
  // ---------------------------------------------------------------------------
  const handleContainerKeyDown = useCallback(
    (e) => {
      // Let the engine process the key
      engine.handleKeyDown(e);

      // Play sounds for meaningful keystrokes
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (
        [
          'Shift',
          'CapsLock',
          'Tab',
          'Escape',
          'Enter',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
        ].includes(e.key)
      ) {
        return;
      }

      if (engine.isFinished) return;

      if (e.key === 'Backspace') {
        playKeystroke();
        return;
      }

      // Single printable character
      if (e.key.length === 1) {
        // Peek at the expected character to decide correct vs error sound.
        // charStates and charIndex give us the current position.
        const expected = engine.charStates[engine.charIndex];
        if (expected && e.key !== expected.char && e.key !== ' ') {
          playError();
        } else {
          playKeystroke();
        }
      }
    },
    [engine, playKeystroke, playError]
  );

  // ---------------------------------------------------------------------------
  // Auto-focus the typing container on mount and after passage changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!engine.isFinished && !loading) {
      // Loop a few times because Framer Motion exit animations can delay mounting
      let attempts = 0;
      const interval = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.focus();
          clearInterval(interval);
        }
        attempts++;
        if (attempts > 20) clearInterval(interval); // fail safe
      }, 50);
      return () => clearInterval(interval);
    }
  }, [passage, engine.isFinished, loading]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const showConfig = !engine.isActive && !engine.isFinished;
  const showResults = engine.isFinished && completedResult;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-8">
      {/* ------------------------------------------------------------------ */}
      {/* Test configuration (hidden during active test / results)           */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            key="config"
            variants={configVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full overflow-hidden"
          >
            <TestConfig />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Live stats (WPM / accuracy / timer)                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full max-w-2xl mx-auto mb-2">
        <LiveStats
          wpm={engine.wpm}
          accuracy={engine.accuracy}
          timeLeft={engine.timeLeft}
          elapsed={engine.elapsed}
          mode={testMode}
          isActive={engine.isActive}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Typing area  /  Results card                                       */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence mode="wait">
        {showResults ? (
          /* ---- Results ---- */
          <motion.div
            key="results"
            variants={resultsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <ResultsCard
              wpm={completedResult.wpm}
              rawWpm={completedResult.rawWpm}
              accuracy={completedResult.accuracy}
              correctChars={completedResult.correctChars}
              incorrectChars={completedResult.incorrectChars}
              totalChars={completedResult.totalChars}
              duration={completedResult.elapsed}
              mode={testMode}
              modeValue={testModeValue}
              contentMode={contentMode}
              keystrokeLog={completedResult.keystrokeLog}
              onRestart={handleRestart}
              onNext={handleNextTest}
            />

          </motion.div>
        ) : (
          /* ---- Typing area ---- */
          <motion.div
            key="typing"
            variants={typingAreaVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            {loading ? (
              /* Loading skeleton while learn passage generates */
              <div
                className="w-full max-w-2xl mx-auto rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <SkeletonText lines={4} />
                <p
                  className="text-xs mt-4 text-center"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Loading passage...
                </p>
              </div>
            ) : (
              /* Typing container */
              <div
                ref={containerRef}
                tabIndex={0}
                autoFocus
                className="relative w-full max-w-2xl mx-auto rounded-xl p-6 outline-none cursor-text"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  transition: 'border-color 0.2s ease',
                  borderColor: isFocused
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleContainerKeyDown}
              >
                {/* Blur overlay when not focused and not already typing */}
                <AnimatePresence>
                  {!isFocused && !engine.isActive && (
                    <motion.div
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        opacity: 0.85,
                        backdropFilter: 'blur(4px)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.85 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p
                        className="text-sm font-medium select-none"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Click here or press any key to start typing
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Typing display */}
                <TypingDisplay
                  charStates={engine.charStates}
                  charIndex={engine.charIndex}
                  caretStyle={caretStyle}
                  smoothCaret={smoothCaret}
                  font={font}
                  fontSize={fontSize}
                />
                
                {/* Virtual Keyboard */}
                {showVirtualKeyboard && (
                  <VirtualKeyboard nextChar={engine.nextExpectedChar} />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Restart hint                                                       */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {(engine.isActive || engine.isFinished) && (
          <motion.p
            className="mt-6 text-xs select-none"
            style={{ color: 'var(--color-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <kbd
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Tab
            </kbd>
            {' + '}
            <kbd
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Enter
            </kbd>
            {' or '}
            <kbd
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Esc
            </kbd>
            {' to restart'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
