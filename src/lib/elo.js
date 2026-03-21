/**
 * ELO Rating System
 * Standard Elo formula with K-factor of 32
 */

const K_FACTOR = 32;

/**
 * Calculate expected score for player A against player B
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match
 * @param {number} ratingA - Player A's current ELO
 * @param {number} ratingB - Player B's current ELO
 * @param {number} scoreA - 1 for win, 0 for loss, 0.5 for draw
 * @returns {{ newRatingA: number, newRatingB: number, deltaA: number, deltaB: number }}
 */
export function calculateElo(ratingA, ratingB, scoreA) {
  const scoreB = 1 - scoreA;
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = expectedScore(ratingB, ratingA);

  const deltaA = Math.round(K_FACTOR * (scoreA - expectedA));
  const deltaB = Math.round(K_FACTOR * (scoreB - expectedB));

  return {
    newRatingA: Math.max(0, ratingA + deltaA),
    newRatingB: Math.max(0, ratingB + deltaB),
    deltaA,
    deltaB,
  };
}

/**
 * Rank tier definitions
 */
export const RANK_TIERS = [
  { name: 'Iron', min: 0, max: 799, color: '#6B7280', icon: '🪨' },
  { name: 'Bronze', min: 800, max: 999, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', min: 1000, max: 1199, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', min: 1200, max: 1399, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', min: 1400, max: 1599, color: '#00CED1', icon: '💠' },
  { name: 'Diamond', min: 1600, max: 1799, color: '#B9F2FF', icon: '💎' },
  { name: 'Master', min: 1800, max: 1999, color: '#FF6B6B', icon: '🏆' },
  { name: 'Grandmaster', min: 2000, max: Infinity, color: '#FFD700', icon: '👑' },
];

/**
 * Get rank tier for a given ELO rating
 */
export function getRankTier(elo) {
  return RANK_TIERS.find((tier) => elo >= tier.min && elo <= tier.max) || RANK_TIERS[0];
}

/**
 * Get progress within current rank tier (0-100)
 */
export function getRankProgress(elo) {
  const tier = getRankTier(elo);
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min;
  return Math.round(((elo - tier.min) / range) * 100);
}

/**
 * Generate a 6-character room code
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
