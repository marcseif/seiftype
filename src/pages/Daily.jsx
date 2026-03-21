/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import useUserStore from '../stores/userStore';
import usePreferencesStore from '../stores/preferencesStore';
import { getDailyChallenge, getDailyLeaderboard, submitDailyResult, supabase } from '../lib/supabase';
import { calculateXP } from '../lib/metrics';
import { toastXP } from '../components/ui/Toast';
import { getDailyText } from '../data/words';
import useTypingEngine from '../hooks/useTypingEngine';
import TypingDisplay from '../components/typing/TypingDisplay';
import LiveStats from '../components/typing/LiveStats';
import ResultsCard from '../components/typing/ResultsCard';
import DailyLeaderboard from '../components/daily/DailyLeaderboard';
import StreakDisplay from '../components/daily/StreakDisplay';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';


export default function Daily() {
  const { user, profile, addXP, updateUserProfile } = useUserStore();
  const { caretStyle, smoothCaret, font, fontSize } = usePreferencesStore();

  const today = new Date().toISOString().split('T')[0];

  const isPresent = useIsPresent();

  const [passage, setPassage] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [myResult, setMyResult] = useState(null);
  const containerRef = useRef(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const { data } = await getDailyLeaderboard(today, 20);
      setLeaderboard(data || []);

      if (user) {
        const existing = (data || []).find((r) => r.user_id === user.id);
        if (existing) {
          setMyResult(existing);
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [today, user]);

  const loadDaily = useCallback(async () => {
    try {
      setLoading(true);
      let { data: challenge } = await getDailyChallenge(today);

      if (!challenge) {
        const text = getDailyText(today);
        setPassage(text);
      } else {
        setPassage(challenge.passage_text);
      }

      await loadLeaderboard();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [today, loadLeaderboard]);

  const handleComplete = useCallback(async (results) => {
    if (!user) return; // Must be logged in to submit

    // If we've already scored better today, don't overwrite with a worse score
    if (myResult && results.wpm <= myResult.wpm) {
      toast.success('Challenge completed (Score was not higher than your best today)');
      setSubmitted(true);
      return;
    }

    const { data, error } = await submitDailyResult({
      user_id: user.id,
      challenge_date: today,
      wpm: results.wpm,
      accuracy: results.accuracy,
      duration_seconds: results.elapsed,
    });
    
    if (error) {
      console.error('Failed to submit daily result:', error);
      toast.error('Could not save score: ' + error.message);
      setSubmitted(true);
    } else if (data) {
      setMyResult(data);
      setSubmitted(true);
      toast.success('Daily challenge completed!');
      loadLeaderboard();
    }

    // Always give XP + breakdown even if leaderboard submission fails
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
  }, [user, profile, today, loadLeaderboard, addXP, updateUserProfile, myResult]);

  const engine = useTypingEngine(passage, 'words', 50, handleComplete);

  useEffect(() => {
    if (!isPresent) {
      engine.pause();
    }
  }, [isPresent, engine]);

  useEffect(() => {
    if (passage && !engine.isFinished) {
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
  }, [passage, engine.isFinished]);

  useEffect(() => {
    loadDaily();
  }, [loadDaily]);

  // Realtime leaderboard updates
  useEffect(() => {
    const channel = supabase
      .channel('daily-leaderboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_results',
        filter: `challenge_date=eq.${today}`,
      }, () => {
        loadLeaderboard();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [today, loadLeaderboard]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>Daily Challenge</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {profile && (
          <StreakDisplay streak={profile.streak || 0} freezeCount={profile.streak_freeze_count || 0} />
        )}
      </div>

      {/* Typing Area or Results */}
      {!engine.isFinished ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <LiveStats
            wpm={engine.wpm}
            accuracy={engine.accuracy}
            elapsed={engine.elapsed}
            mode="words"
            isActive={engine.isActive}
          />

          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={engine.handleKeyDown}
            className="outline-none rounded-xl border p-6 cursor-text focus:ring-2"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            autoFocus
          >
            {passage ? (
              <TypingDisplay
                charStates={engine.charStates}
                charIndex={engine.charIndex}
                caretStyle={caretStyle}
                smoothCaret={smoothCaret}
                font={font}
                fontSize={fontSize}
              />
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                Loading daily challenge...
              </p>
            )}
          </div>

          {!user && (
            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Sign in to save your daily result and appear on the leaderboard.
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ResultsCard
            wpm={engine.wpm}
            rawWpm={engine.rawWpm}
            accuracy={engine.accuracy}
            correctChars={engine.correctChars}
            incorrectChars={engine.incorrectChars}
            totalChars={engine.totalChars}
            duration={engine.elapsed}
            mode="words"
            contentMode="daily"
            keystrokeLog={engine.keystrokeLog}
            onRestart={() => {
              engine.restart();
              setSubmitted(false);
            }}
          />

          {submitted && myResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 rounded-xl border text-center"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-success)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                Result submitted! {myResult.rank ? `You ranked #${myResult.rank}` : 'Check the leaderboard.'}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Today's Leaderboard
        </h3>
        <DailyLeaderboard results={leaderboard} currentUserId={user?.id} />
      </div>

      {/* Shareable Result Card */}
      {submitted && myResult && (
        <div
          className="rounded-xl border p-5 text-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Share Your Result
          </h3>
          <div
            className="inline-block rounded-lg p-4 text-left"
            style={{ background: 'var(--color-bg)' }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              seiftype daily — {today}
            </div>
            <div className="text-lg font-black" style={{ color: 'var(--color-primary)' }}>
              {Math.round(myResult.wpm)} WPM
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {myResult.accuracy.toFixed(1)}% accuracy
            </div>
            {profile && (
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                🔥 {profile.streak || 0} day streak
              </div>
            )}
          </div>
          <div className="mt-3">
            <button
              onClick={() => {
                const text = `seiftype daily ${today}\n${Math.round(myResult.wpm)} WPM | ${myResult.accuracy.toFixed(1)}% accuracy\n🔥 ${profile?.streak || 0} day streak`;
                navigator.clipboard.writeText(text);
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
