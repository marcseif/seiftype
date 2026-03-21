import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiStar } from 'react-icons/fi';
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

  if (activeLesson) {
    return <LessonRunner lesson={activeLesson} onExit={() => setActiveLesson(null)} />;
  }

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
              {category.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className="flex flex-col text-left p-4 rounded-lg border transition-all hover:-translate-y-1"
                  style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{lesson.title}</span>
                  <span className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Target: {lesson.targetWpm} WPM</span>
                  <div className="flex gap-1 mt-auto">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar key={star} className="w-3 h-3" style={{ color: 'var(--color-border)', fill: 'transparent' }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonRunner({ lesson, onExit }) {
  const { user, profile, addXP, updateUserProfile } = useUserStore();
  const { caretStyle, smoothCaret, font, fontSize } = usePreferencesStore();

  const [finished, setFinished] = useState(false);
  const [resultData, setResultData] = useState(null);
  const containerRef = useRef(null);

  const handleComplete = useCallback(async (results) => {
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
    if (containerRef.current) {
      containerRef.current.focus();
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
              onKeyDown={engine.handleKeyDown}
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
              <VirtualKeyboard nextChar={engine.nextExpectedChar} />
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
                setTimeout(() => containerRef.current?.focus(), 10);
              }}
              onNext={onExit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}