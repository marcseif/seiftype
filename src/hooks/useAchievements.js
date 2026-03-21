import { useState, useRef, useCallback, useEffect } from 'react';
import { ACHIEVEMENTS, checkAchievements } from '../data/achievements';
import { getUserAchievements, unlockAchievement } from '../lib/supabase';
import useUserStore from '../stores/userStore';

/**
 * Achievement checking hook.
 *
 * On mount it loads the user's already-unlocked achievements from Supabase.
 * After each test completion, call `checkAndUnlock(stats, currentResult, recentResults)`
 * to evaluate every achievement definition and persist any new unlocks.
 */
export default function useAchievements() {
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);

  // Set of achievement keys the user has already unlocked
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const unlockedKeysRef = useRef(new Set());

  // Newly unlocked achievements from the latest check (for toasts / animations)
  const [newUnlocks, setNewUnlocks] = useState([]);

  // Loading flag
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Load existing unlocks from Supabase on mount / user change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) {
        unlockedKeysRef.current = new Set();
        setUnlockedAchievements([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await getUserAchievements(user.id);
        if (cancelled) return;
        if (error) {
          console.error('Failed to load achievements:', error);
          return;
        }

        const keys = (data || []).map((a) => a.achievement_key);
        unlockedKeysRef.current = new Set(keys);

        // Build full achievement objects for the unlocked list
        const full = keys
          .filter((k) => ACHIEVEMENTS[k])
          .map((k) => ({
            ...ACHIEVEMENTS[k],
            unlockedAt: data.find((a) => a.achievement_key === k)?.unlocked_at,
          }));

        setUnlockedAchievements(full);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ---------------------------------------------------------------------------
  // checkAndUnlock -- call after a test completes
  // ---------------------------------------------------------------------------
  const checkAndUnlock = useCallback(
    async (stats, currentResult, recentResults) => {
      const newlyUnlocked = checkAchievements(
        stats,
        currentResult,
        recentResults,
        profile,
        unlockedKeysRef.current
      );

      if (newlyUnlocked.length === 0) return [];

      // Optimistically update local state
      const newAchievementObjects = newlyUnlocked
        .filter((k) => ACHIEVEMENTS[k])
        .map((k) => ({
          ...ACHIEVEMENTS[k],
          unlockedAt: new Date().toISOString(),
        }));

      newlyUnlocked.forEach((k) => unlockedKeysRef.current.add(k));

      setUnlockedAchievements((prev) => [...prev, ...newAchievementObjects]);
      setNewUnlocks(newAchievementObjects);

      // Persist to Supabase (fire-and-forget per achievement)
      if (user?.id) {
        await Promise.allSettled(
          newlyUnlocked.map((key) => unlockAchievement(user.id, key))
        );
      }

      return newAchievementObjects;
    },
    [profile, user?.id]
  );

  // ---------------------------------------------------------------------------
  // Clear the "new unlocks" list (call after user has seen the notification)
  // ---------------------------------------------------------------------------
  const clearNewUnlocks = useCallback(() => {
    setNewUnlocks([]);
  }, []);

  return {
    checkAndUnlock,
    unlockedAchievements,
    newUnlocks,
    clearNewUnlocks,
    loading,
  };
}
