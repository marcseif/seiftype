/**
 * Statistics calculation utilities
 */

/**
 * Calculate WPM from character count and time elapsed
 * Standard: 1 word = 5 characters
 */
export function calculateWPM(correctChars, timeSeconds) {
  if (timeSeconds <= 0) return 0;
  return Math.round((correctChars / 5) / (timeSeconds / 60));
}

/**
 * Calculate raw WPM (all characters typed, including errors)
 */
export function calculateRawWPM(totalChars, timeSeconds) {
  if (timeSeconds <= 0) return 0;
  return Math.round((totalChars / 5) / (timeSeconds / 60));
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correctChars, totalChars) {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 10000) / 100;
}

/**
 * Calculate XP earned from a test
 */
export function calculateXP(wpm, accuracy, durationSeconds) {
  const durationMultiplier = Math.max(1, durationSeconds / 30);
  return Math.max(1, Math.floor(wpm * (accuracy / 100) * durationMultiplier));
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp) {
  return Math.max(1, Math.min(100, Math.floor(Math.sqrt(xp / 50)) + 1));
}

/**
 * Get XP required for a given level
 */
export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 50;
}

/**
 * Get XP progress within current level (0-1)
 */
export function getLevelProgress(xp) {
  const level = calculateLevel(xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

/**
 * Aggregate stats from test results
 */
export function aggregateStats(results) {
  if (!results || results.length === 0) {
    return {
      bestWPM: 0,
      bestAccuracy: 0,
      avgWPM: 0,
      avgAccuracy: 0,
      totalTests: 0,
      totalTime: 0,
      avgLast10: 0,
      avgLast100: 0,
      mostPracticedMode: 'random',
    };
  }

  const sorted = [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const bestWPM = Math.max(...results.map((r) => r.wpm));
  const bestAccuracy = Math.max(...results.map((r) => r.accuracy));
  const avgWPM = Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length);
  const avgAccuracy =
    Math.round((results.reduce((s, r) => s + r.accuracy, 0) / results.length) * 100) / 100;
  const totalTime = results.reduce((s, r) => s + (r.duration_seconds || 0), 0);

  const last10 = sorted.slice(0, 10);
  const avgLast10 = last10.length
    ? Math.round(last10.reduce((s, r) => s + r.wpm, 0) / last10.length)
    : 0;

  const last100 = sorted.slice(0, 100);
  const avgLast100 = last100.length
    ? Math.round(last100.reduce((s, r) => s + r.wpm, 0) / last100.length)
    : 0;

  // Most practiced mode & personal bests
  const modeCounts = {};
  const personalBests = {};
  
  results.forEach((r) => {
    let modeName = r.mode;
    if (r.mode === 'words' || r.mode === 'time') {
      modeName = `${r.mode.charAt(0).toUpperCase() + r.mode.slice(1)} ${r.mode_value}`;
      
      const pbKey = `${r.mode}_${r.mode_value}`;
      if (!personalBests[pbKey] || r.wpm > personalBests[pbKey].wpm) {
        personalBests[pbKey] = { wpm: r.wpm, accuracy: r.accuracy };
      }
    } else if (r.content_mode) {
      modeName = `${r.mode} ${r.content_mode}`;
    }
    modeCounts[modeName] = (modeCounts[modeName] || 0) + 1;
  });
  const mostPracticedMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  return {
    bestWPM,
    bestAccuracy,
    avgWPM,
    avgAccuracy,
    totalTests: results.length,
    totalTime,
    avgLast10,
    avgLast100,
    mostPracticedMode,
    personalBests,
  };
}

/**
 * Group results by hour of day for "Best time of day" chart
 */
export function groupByHour(results) {
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
    avgWPM: 0,
    count: 0,
    totalWPM: 0,
  }));

  results.forEach((r) => {
    const hour = new Date(r.created_at).getHours();
    hourData[hour].totalWPM += r.wpm;
    hourData[hour].count += 1;
  });

  hourData.forEach((h) => {
    h.avgWPM = h.count > 0 ? Math.round(h.totalWPM / h.count) : 0;
  });

  return hourData;
}

/**
 * Group results by date for WPM trend chart
 */
export function groupByDate(results, days = 30) {
  const now = new Date();
  const dateMap = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dateMap[key] = { date: key, avgWPM: 0, avgAccuracy: 0, count: 0, totalWPM: 0, totalAcc: 0 };
  }

  results.forEach((r) => {
    const key = new Date(r.created_at).toISOString().split('T')[0];
    if (dateMap[key]) {
      dateMap[key].totalWPM += r.wpm;
      dateMap[key].totalAcc += r.accuracy;
      dateMap[key].count += 1;
    }
  });

  return Object.values(dateMap).map((d) => ({
    date: d.date,
    avgWPM: d.count > 0 ? Math.round(d.totalWPM / d.count) : null,
    avgAccuracy: d.count > 0 ? Math.round((d.totalAcc / d.count) * 100) / 100 : null,
    tests: d.count,
  }));
}

/**
 * Extract per-key stats from keystroke data
 */
export function extractKeyStats(keystrokeData) {
  if (!keystrokeData || !Array.isArray(keystrokeData)) return {};

  const keyStats = {};

  keystrokeData.forEach(({ key, delay, correct }) => {
    if (!key || key.length !== 1) return;
    const k = key.toLowerCase();
    if (!keyStats[k]) {
      keyStats[k] = { key: k, totalDelay: 0, count: 0, errors: 0 };
    }
    keyStats[k].totalDelay += delay || 0;
    keyStats[k].count += 1;
    if (!correct) keyStats[k].errors += 1;
  });

  Object.values(keyStats).forEach((s) => {
    s.avgDelay = s.count > 0 ? Math.round(s.totalDelay / s.count) : 0;
    s.errorRate = s.count > 0 ? Math.round((s.errors / s.count) * 10000) / 100 : 0;
  });

  return keyStats;
}

/**
 * Extract bigram timing data
 */
export function extractBigrams(keystrokeData) {
  if (!keystrokeData || keystrokeData.length < 2) return [];

  const bigramMap = {};

  for (let i = 1; i < keystrokeData.length; i++) {
    const prev = keystrokeData[i - 1];
    const curr = keystrokeData[i];
    if (!prev.key || !curr.key || prev.key.length !== 1 || curr.key.length !== 1) continue;

    const bigram = (prev.key + curr.key).toLowerCase();
    if (!bigramMap[bigram]) {
      bigramMap[bigram] = { bigram, totalDelay: 0, count: 0, errors: 0 };
    }
    bigramMap[bigram].totalDelay += curr.delay || 0;
    bigramMap[bigram].count += 1;
    if (!curr.correct) bigramMap[bigram].errors += 1;
  }

  return Object.values(bigramMap)
    .map((b) => ({
      bigram: b.bigram,
      avg_delay_ms: b.count > 0 ? Math.round(b.totalDelay / b.count) : 0,
      error_rate: b.count > 0 ? Math.round((b.errors / b.count) * 10000) / 100 : 0,
      sample_count: b.count,
    }))
    .sort((a, b) => b.avg_delay_ms - a.avg_delay_ms);
}
