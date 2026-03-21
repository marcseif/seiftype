/**
 * Achievement definitions and checking logic
 */

export const ACHIEVEMENTS = {
  // Speed milestones
  speed_50: {
    key: 'speed_50',
    name: 'Getting Started',
    description: 'Reach 50 WPM on any test',
    icon: '⚡',
    category: 'speed',
    check: (stats) => stats.bestWPM >= 50,
  },
  speed_75: {
    key: 'speed_75',
    name: 'Quick Fingers',
    description: 'Reach 75 WPM on any test',
    icon: '🔥',
    category: 'speed',
    check: (stats) => stats.bestWPM >= 75,
  },
  speed_100: {
    key: 'speed_100',
    name: 'Century Club',
    description: 'Reach 100 WPM on any test',
    icon: '💯',
    category: 'speed',
    check: (stats) => stats.bestWPM >= 100,
  },
  speed_120: {
    key: 'speed_120',
    name: 'Speed Demon',
    description: 'Reach 120 WPM on any test',
    icon: '👹',
    category: 'speed',
    check: (stats) => stats.bestWPM >= 120,
  },
  speed_150: {
    key: 'speed_150',
    name: 'Supersonic',
    description: 'Reach 150 WPM on any test',
    icon: '🚀',
    category: 'speed',
    check: (stats) => stats.bestWPM >= 150,
  },

  // Accuracy
  accuracy_perfect: {
    key: 'accuracy_perfect',
    name: 'Flawless',
    description: 'Complete a test with 100% accuracy',
    icon: '🎯',
    category: 'accuracy',
    check: (stats, result) => result && result.accuracy === 100,
  },
  accuracy_surgeon: {
    key: 'accuracy_surgeon',
    name: 'Surgeon',
    description: 'Maintain >99% accuracy across 10 consecutive tests',
    icon: '🔬',
    category: 'accuracy',
    check: (stats, _, results) => {
      if (!results || results.length < 10) return false;
      const last10 = results.slice(0, 10);
      return last10.every((r) => r.accuracy > 99);
    },
  },

  // Streak
  streak_7: {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day typing streak',
    icon: '📅',
    category: 'streak',
    check: (stats, _, __, user) => user && user.streak >= 7,
  },
  streak_30: {
    key: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day typing streak',
    icon: '📆',
    category: 'streak',
    check: (stats, _, __, user) => user && user.streak >= 30,
  },
  streak_100: {
    key: 'streak_100',
    name: 'Centurion',
    description: 'Maintain a 100-day typing streak',
    icon: '🏛️',
    category: 'streak',
    check: (stats, _, __, user) => user && user.streak >= 100,
  },

  // Multiplayer
  mp_first_win: {
    key: 'mp_first_win',
    name: 'First Blood',
    description: 'Win your first multiplayer race',
    icon: '⚔️',
    category: 'multiplayer',
    check: (stats) => stats.racesWon >= 1,
  },
  mp_win_streak_5: {
    key: 'mp_win_streak_5',
    name: 'Unstoppable',
    description: 'Win 5 races in a row',
    icon: '🔥',
    category: 'multiplayer',
    check: (stats) => stats.winStreak >= 5,
  },
  mp_gold: {
    key: 'mp_gold',
    name: 'Gold Standard',
    description: 'Reach Gold rank (1200+ ELO)',
    icon: '🥇',
    category: 'multiplayer',
    check: (stats, _, __, user) => user && user.elo >= 1200,
  },
  mp_diamond: {
    key: 'mp_diamond',
    name: 'Brilliant',
    description: 'Reach Diamond rank (1600+ ELO)',
    icon: '💎',
    category: 'multiplayer',
    check: (stats, _, __, user) => user && user.elo >= 1600,
  },
  mp_grandmaster: {
    key: 'mp_grandmaster',
    name: 'Grandmaster',
    description: 'Reach Grandmaster rank (2000+ ELO)',
    icon: '👑',
    category: 'multiplayer',
    check: (stats, _, __, user) => user && user.elo >= 2000,
  },

  // Modes
  modes_all: {
    key: 'modes_all',
    name: 'Jack of All Trades',
    description: 'Complete all 4 content modes at least once',
    icon: '🃏',
    category: 'modes',
    check: (stats) => {
      const modes = new Set(stats.modesPlayed || []);
      return ['random', 'quotes', 'code', 'custom'].every((m) => modes.has(m));
    },
  },
  code_ninja: {
    key: 'code_ninja',
    name: 'Code Ninja',
    description: 'Complete 20 code snippet tests',
    icon: '🥷',
    category: 'modes',
    check: (stats) => stats.codeCompleted >= 20,
  },

  // Volume
  tests_100: {
    key: 'tests_100',
    name: 'Dedicated',
    description: 'Complete 100 typing tests',
    icon: '💪',
    category: 'volume',
    check: (stats) => stats.totalTests >= 100,
  },
  tests_500: {
    key: 'tests_500',
    name: 'Committed',
    description: 'Complete 500 typing tests',
    icon: '🏋️',
    category: 'volume',
    check: (stats) => stats.totalTests >= 500,
  },
  tests_1000: {
    key: 'tests_1000',
    name: 'Legendary',
    description: 'Complete 1000 typing tests',
    icon: '🏆',
    category: 'volume',
    check: (stats) => stats.totalTests >= 1000,
  },

  // Special
  night_owl: {
    key: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a test between midnight and 4 AM',
    icon: '🦉',
    category: 'special',
    check: (_, result) => {
      if (!result) return false;
      const hour = new Date(result.created_at || Date.now()).getHours();
      return hour >= 0 && hour < 4;
    },
  },
  early_bird: {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a test between 5 AM and 7 AM',
    icon: '🐦',
    category: 'special',
    check: (_, result) => {
      if (!result) return false;
      const hour = new Date(result.created_at || Date.now()).getHours();
      return hour >= 5 && hour < 7;
    },
  },
};

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'speed', name: 'Speed', icon: '⚡' },
  { key: 'accuracy', name: 'Accuracy', icon: '🎯' },
  { key: 'streak', name: 'Streak', icon: '📅' },
  { key: 'multiplayer', name: 'Multiplayer', icon: '⚔️' },
  { key: 'modes', name: 'Modes', icon: '🃏' },
  { key: 'volume', name: 'Volume', icon: '💪' },
  { key: 'special', name: 'Special', icon: '✨' },
];

/**
 * Check which achievements should be unlocked
 * @returns {string[]} Array of newly unlocked achievement keys
 */
export function checkAchievements(stats, currentResult, recentResults, user, unlockedKeys) {
  const newUnlocks = [];

  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (unlockedKeys.has(key)) continue;
    try {
      if (achievement.check(stats, currentResult, recentResults, user)) {
        newUnlocks.push(key);
      }
    } catch {
      // Skip achievements that fail to check
    }
  }

  return newUnlocks;
}
