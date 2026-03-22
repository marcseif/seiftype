import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';
import { FiChevronLeft, FiStar, FiLock } from 'react-icons/fi';
import { LESSON_CATEGORIES } from '../data/lessons';
import useTypingEngine from '../hooks/useTypingEngine';
import TypingDisplay from '../components/typing/TypingDisplay';
import LiveStats from '../components/typing/LiveStats';
import VirtualKeyboard from '../components/typing/VirtualKeyboard';
import ResultsCard from '../components/typing/ResultsCard';
import usePreferencesStore from '../stores/preferencesStore';
import useUserStore from '../stores/userStore';
import { saveTestResult } from '../lib/supabase';
import { calculateXP } from '../lib/metrics';
import { toastXP } from '../components/ui/Toast';

export default function Lessons() {
  const [activeLesson, setActiveLesson] = useState(null);
  const completedLessons = usePreferencesStore(s => s.completedLessons) || []; 
  const lessonResults = usePreferencesStore(s => s.lessonResults) || {};

  if (activeLesson) {
    return <LessonRunner lesson={activeLesson} onExit={() => setActiveLesson(null)} />;
  }

  // Create a flattened array of lessons to calculate locking easily
  const flatLessons = [];
  LESSON_CATEGORIES.forEach(cat => {
    cat.lessons.forEach(l => {
      flatLessons.push(l.id);
    });
  });

  const nextLessonId = flatLessons.find(id => !completedLessons.includes(id)) || flatLessons[0];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text)' }}>Typing Lessons</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Master touch typing step by step.</p>
      </div>

      <div className="flex flex-col gap-8">
        {LESSON_CATEGORIES.map((category) => (
          <div key={category.id} className="rounded-xl border p-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{category.title}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{category.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {category.lessons.map((lesson) => {
                const lessonIndex = flatLessons.indexOf(lesson.id);
                const isCompleted = completedLessons.includes(lesson.id);
                const isNext = lesson.id === nextLessonId;
                // Locked if it's not completed, AND it's not the currently active "next" lesson
                const isLocked = !isCompleted && !isNext;

                return (
                  <div key={lesson.id} className="relative group perspective-1000">
                    <button
                      onClick={() => !isLocked && setActiveLesson(lesson)}
                      className={`w-full flex flex-col text-left p-4 rounded-lg border transition-all duration-300 relative overflow-hidden ${isLocked ? 'opacity-60 cursor-not-allowed group-hover:scale-[0.98]' : 'hover:-translate-y-1 hover:shadow-lg'}`}
                      style={{
                        background: 'var(--color-bg)',
                        borderColor: isCompleted ? 'var(--color-success)' : isNext ? 'var(--color-primary)' : 'var(--color-border)',
                        boxShadow: isNext ? '0 0 15px rgba(233, 69, 96, 0.4)' : 'none',
                      }}
                    >
                      {/* Highlight the next lesson slightly with a label */}
                      {isNext && (
                        <div className="absolute top-0 right-0 px-2 py-1 text-[10px] font-bold uppercase rounded-bl-lg" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                          Up Next
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{lesson.title}</span>
                        {isLocked && <FiLock className="text-xs" style={{ color: 'var(--color-text-muted)' }} />}
                      </div>
                      <span className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Target: {lesson.targetWpm} WPM</span>
                      <div className="flex gap-1 mt-auto z-10">
                        {[1, 2, 3, 4, 5].map(star => {
                          const earnedStars = lessonResults[lesson.id]?.stars || 0;
                          const isEarned = star <= earnedStars;
                          return (
                            <FiStar 
                              key={star} 
                              className="w-3 h-3 transition-colors" 
                              style={{ 
                                color: isEarned ? '#eab308' : 'var(--color-border)', 
                                fill: isEarned ? '#eab308' : 'transparent' 
                              }} 
                            />
                          );
                        })}
                      </div>
                    </button>

                    {/* Tooltip that animates in on hover over locked lessons */}
                    {isLocked && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded bg-black text-white text-xs whitespace-nowrap opacity-0 scale-95 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 z-20">
                        Complete previous lessons first
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonRunner({ lesson, onExit }) {
  const { user, profile, addXP, updateUserProfile } = useUserStore();
  const prefs = usePreferencesStore();
  const { caretStyle, smoothCaret, font, fontSize, markLessonCompleted } = prefs;

  const isPresent = useIsPresent();

  const [finished, setFinished] = useState(false);
  const [resultData, setResultData] = useState(null);
  const containerRef = useRef(null);

  const handleComplete = useCallback(async (results) => {
    let earnedStars = 0;
    for (let i = 0; i < lesson.stars.length; i++) {
      if (results.wpm >= lesson.stars[i]) {
        earnedStars = i + 1;
      }
    }

    if (results.wpm >= lesson.targetWpm) {
      markLessonCompleted(lesson.id, earnedStars, results.wpm);
    }
    setFinished(true);
    setResultData(results);

    if (user) {
      const testResult = {
        user_id: user.id,
        wpm: results.wpm,
        accuracy: results.accuracy,
        mode: 'words',
        mode_value: 0,
        content_mode: 'custom',
        content_submode: `lesson_${lesson.id}`,
        duration_seconds: Math.round(results.elapsed),
      };
      await saveTestResult(testResult);

      const xp = calculateXP(results.wpm, results.accuracy, results.elapsed);
      const wpmXP = Math.floor(xp * 0.7);
      const accXP = xp - wpmXP;
      addXP(xp);
      toastXP(xp, { wpmXP, accXP });

      if (profile) {
        updateUserProfile({
          tests_completed: (profile.tests_completed || 0) + 1,
          xp: (profile.xp || 0) + xp,
        });
      }
    }
  }, [user, profile, addXP, updateUserProfile, lesson.id]);

  const engine = useTypingEngine(
    lesson.content,
    'words',
    lesson.content.split(' ').length,
    handleComplete
  );

  useEffect(() => {
    if (!isPresent) {
      engine.pause();
    }
  }, [isPresent, engine]);

  const engineReset = engine.reset;
  const engineIsActive = engine.isActive;
  useEffect(() => {
    const handleKeyDown = (e) => {
      const mode = prefs.restartKey || 'tab';
      if (e.key === 'Tab') {
        const isFocused = document.activeElement === containerRef.current;
        if ((mode === 'tab' || mode === 'tab_enter') && (isFocused || engineIsActive)) e.preventDefault();
        if (mode === 'tab') {
          setFinished(false);
          setResultData(null);
          engineReset();
          setTimeout(() => containerRef.current?.focus({ preventScroll: true }), 10);
        }
      }
      if (e.key === 'Escape' || (e.key === 'Escape' && mode === 'esc')) {
        e.preventDefault();
        setFinished(false);
        setResultData(null);
        engineReset();
        setTimeout(() => containerRef.current?.focus({ preventScroll: true }), 10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prefs.restartKey, engineReset, engineIsActive]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Calculate stars earned
  let starsEarned = 0;
  if (resultData) {
    for (let i = 0; i < lesson.stars.length; i++) {
      if (resultData.wpm >= lesson.stars[i]) {
        starsEarned = i + 1;
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onExit}
        className="flex items-center gap-1 text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-primary)' }}
      >
        <FiChevronLeft /> Back to Lessons
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{lesson.title}</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Target: {lesson.targetWpm} WPM</p>
      </div>

      <AnimatePresence mode="wait">
        {!finished ? (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mb-4">
              <LiveStats
                wpm={engine.wpm}
                accuracy={engine.accuracy}
                charIndex={engine.charIndex}
                totalChars={engine.totalChars}
              />
            </div>

            <div
              ref={containerRef}
              tabIndex={0}
              onKeyDown={(e) => {
                const mode = prefs.restartKey || 'tab';
                if (e.key === 'Tab' && (mode === 'tab' || mode === 'tab_enter')) {
                  e.preventDefault();
                }
                engine.handleKeyDown(e);
              }}
              className="outline-none rounded-xl border p-6 cursor-text focus:ring-2"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <TypingDisplay
                charStates={engine.charStates}
                charIndex={engine.charIndex}
                caretStyle={caretStyle}
                smoothCaret={smoothCaret}
                font={font}
                fontSize={fontSize}
              />
              <VirtualKeyboard nextChar={engine.nextExpectedChar} forceShowKeys={true} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <FiStar 
                    key={star} 
                    className="w-10 h-10 transition-colors" 
                    style={{ 
                      color: star <= starsEarned ? '#FFD700' : 'var(--color-border)', 
                      fill: star <= starsEarned ? '#FFD700' : 'transparent' 
                    }} 
                  />
                ))}
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {starsEarned >= 3 ? 'Great Job!' : starsEarned > 0 ? 'Good Effort!' : 'Keep Practicing!'}
              </h3>
            </div>
            <ResultsCard
              wpm={resultData.wpm}
              rawWpm={resultData.rawWpm}
              accuracy={resultData.accuracy}
              correctChars={resultData.correctChars}
              incorrectChars={resultData.incorrectChars}
              totalChars={resultData.totalChars}
              duration={resultData.elapsed}
              mode="lesson"
              contentMode={lesson.title}
              keystrokeLog={resultData.keystrokeLog}
              onRestart={() => {
                setFinished(false);
                setResultData(null);
                engine.reset();
                setTimeout(() => containerRef.current?.focus({ preventScroll: true }), 10);
              }}
              onNext={onExit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}