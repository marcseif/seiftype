import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUserStore from '../stores/userStore';
import { FiUserPlus, FiUserCheck, FiClock, FiUserMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Supabase data fetchers
import {
  getProfileByUsername,
  getTestResults,
  getUserAchievements,
  getFriendshipStatus,
  sendFriendRequest,
  removeFriend
} from '../lib/supabase';

// Stats utilities
import {
  aggregateStats,
  groupByDate,
  groupByHour,
  extractKeyStats,
} from '../lib/metrics';

// Profile components
import ProfileCard from '../components/profile/ProfileCard';
import BadgeShowcase from '../components/profile/BadgeShowcase';
import RankBadge from '../components/profile/RankBadge';

// Chart / stats components
import WPMChart from '../components/charts/WPMChart';
import AccuracyChart from '../components/charts/AccuracyChart';
import HourChart from '../components/charts/HourChart';
import KeyboardHeatmap from '../components/charts/KeyboardHeatmap';

// Skeleton loader
import { SkeletonProfile } from '../components/ui/LoadingSkeleton';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'charts', label: 'Charts' },
  { key: 'history', label: 'History' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'keyboard', label: 'Keyboard' },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(totalSeconds) {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// StatTile  --  reusable stat box for the overview grid
// ---------------------------------------------------------------------------

function StatTile({ label, value, sub }) {
  return (
    <div
      className="rounded-xl border p-4 text-center"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="text-xl font-bold leading-tight"
        style={{ color: 'var(--color-text)' }}
      >
        {value}
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="text-[10px] mt-0.5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartCard  --  consistent wrapper for chart sections
// ---------------------------------------------------------------------------

function ChartCard({ title, children }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile page component
// ---------------------------------------------------------------------------

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useUserStore();

  // ---- Data state ----
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [friendship, setFriendship] = useState(null);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ---------------------------------------------------------------------------
  // Fetch profile, results, and achievements on mount / username change        
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setNotFound(false);

      // 1. Fetch profile by username
      const { data: profileData, error: profileError } =
        await getProfileByUsername(username);

      if (profileError || !profileData) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setProfile(profileData);

      // 2. Fetch test results, achievements, and friendship status
      const [resultsRes, achievementsRes, friendRes] = await Promise.all([
        getTestResults(profileData.id, 500),
        getUserAchievements(profileData.id),
        currentUser && currentUser.id !== profileData.id 
          ? getFriendshipStatus(currentUser.id, profileData.id) 
          : Promise.resolve({ data: null })
      ]);

      if (!cancelled) {
        setResults(resultsRes.data || []);
        setAchievements(achievementsRes.data || []);
        setFriendship(friendRes?.data || null);
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [username, currentUser]);

  const handleFriendAction = async () => {
    if (!currentUser) return toast.error('Must be logged in');
    if (!profile) return;
    
    setFriendActionLoading(true);
    try {
      if (!friendship || friendship.status === 'none') {
        const { data, error } = await sendFriendRequest(currentUser.id, profile.id);
        if (error) throw error;
        toast.success('Friend request sent!');
        setFriendship({ id: data?.id, status: 'pending', isInitiator: true });
      } else if (friendship.status === 'accepted') {
        const { error } = await removeFriend(friendship.id);
        if (error) throw error;
        toast.success('Friend removed');
        setFriendship(null);
      } else if (friendship.status === 'pending' && friendship.isInitiator) {
        // Cancel request
        const { error } = await removeFriend(friendship.id);
        if (error) throw error;
        toast.success('Friend request cancelled');
        setFriendship(null);
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setFriendActionLoading(false);
    }
  };
  // Derived / computed data  (memoised to avoid recalculating on every render)
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => aggregateStats(results), [results]);

  const dateData = useMemo(() => groupByDate(results, 30), [results]);

  const hourData = useMemo(() => groupByHour(results), [results]);

  const keyStats = useMemo(() => {
    const merged = {};
    results.forEach((r) => {
      if (!r.keystroke_data) return;
      const single = extractKeyStats(r.keystroke_data);
      Object.entries(single).forEach(([key, s]) => {
        if (!merged[key]) {
          merged[key] = { key, totalDelay: 0, count: 0, errors: 0 };
        }
        merged[key].totalDelay += s.totalDelay;
        merged[key].count += s.count;
        merged[key].errors += s.errors;
      });
    });
    Object.values(merged).forEach((s) => {
      s.avgDelay = s.count > 0 ? Math.round(s.totalDelay / s.count) : 0;
      s.errorRate =
        s.count > 0 ? Math.round((s.errors / s.count) * 10000) / 100 : 0;
    });
    return merged;
  }, [results]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-10">
        <SkeletonProfile />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found state
  // ---------------------------------------------------------------------------
  if (notFound) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <div
          className="text-5xl mb-4 select-none"
          style={{ color: 'var(--color-text-muted)' }}
        >
          404
        </div>
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          User not found
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          No account exists with the username{' '}
          <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            {username}
          </span>
          .
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Profile Card & Actions                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative">
        <ProfileCard profile={profile} stats={stats} />
        
        {currentUser && currentUser.id !== profile.id && (
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={handleFriendAction}
              disabled={friendActionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
              style={{
                background: friendship?.status === 'accepted' ? 'var(--color-surface)' : 'var(--color-primary)',
                color: friendship?.status === 'accepted' ? 'var(--color-error)' : '#fff',
                border: friendship?.status === 'accepted' ? '1px solid var(--color-error)' : 'none',
                opacity: friendActionLoading ? 0.6 : 1
              }}
            >
              {friendship?.status === 'accepted' ? (
                <>
                  <FiUserMinus size={16} /> Remove Friend
                </>
              ) : friendship?.status === 'pending' ? (
                friendship.isInitiator ? (
                  <>
                    <FiClock size={16} /> Request Pending
                  </>
                ) : (
                  <>
                    <FiUserCheck size={16} /> Has Requested You
                  </>
                )
              ) : (
                <>
                  <FiUserPlus size={16} /> Add Friend
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab Navigation                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex gap-1 p-1 rounded-xl self-start"
        style={{ background: 'var(--color-bg)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            style={{
              color:
                activeTab === tab.key
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
            }}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="profile-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--color-surface)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab Content                                                        */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence mode="wait">
        {/* ---- Overview ---- */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-6"
          >
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatTile
                label="Best WPM"
                value={stats.bestWPM}
                sub="All time"
              />
              <StatTile
                label="Avg WPM"
                value={stats.avgWPM}
                sub={`${stats.totalTests} tests`}
              />
              <StatTile
                label="Avg Accuracy"
                value={`${stats.avgAccuracy}%`}
              />
              <StatTile
                label="Avg Last 10"
                value={stats.avgLast10}
                sub="Recent"
              />
              <StatTile
                label="Avg Last 100"
                value={stats.avgLast100}
              />
              <StatTile
                label="Most Practiced"
                value={stats.mostPracticedMode}
              />
              <StatTile
                label="Total Time"
                value={formatTime(stats.totalTime)}
              />
            </div>

            {/* Personal Bests */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold mt-2" style={{ color: 'var(--color-text-secondary)' }}>Personal Bests</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[15, 30, 60, 120].map(val => {
                  const pb = stats.personalBests?.['time_' + val];
                  return (
                    <StatTile
                      key={'time_'+val}
                      label={`Time ${val}s`}
                      value={pb ? pb.wpm : '-'}
                      sub={pb ? `${pb.accuracy.toFixed(1)}% acc` : ''}
                    />
                  );
                })}
                {[10, 25, 50, 100].map(val => {
                  const pb = stats.personalBests?.['words_' + val];
                  return (
                    <StatTile
                      key={'words_'+val}
                      label={`Words ${val}`}
                      value={pb ? pb.wpm : '-'}
                      sub={pb ? `${pb.accuracy.toFixed(1)}% acc` : ''}
                    />
                  );
                })}
              </div>
            </div>

            {/* WPM trend -- last 30 days */}
            <ChartCard title="WPM Trend (Last 30 Days)">
              <WPMChart data={dateData} />
            </ChartCard>
          </motion.div>
        )}

        {/* ---- Charts ---- */}
        {activeTab === 'charts' && (
          <motion.div
            key="charts"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <ChartCard title="WPM Over Time">
              <WPMChart data={dateData} />
            </ChartCard>

            <ChartCard title="Accuracy Over Time">
              <AccuracyChart data={dateData} />
            </ChartCard>

            <ChartCard title="Best Time of Day">
              <HourChart data={hourData} />
            </ChartCard>
          </motion.div>
        )}

        {/* ---- Achievements ---- */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Achievements
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'var(--color-primary)' + '22',
                    color: 'var(--color-primary)',
                  }}
                >
                  {achievements.length} unlocked
                </span>
              </div>
              <BadgeShowcase achievements={achievements} />
            </div>
          </motion.div>
        )}

        {/* ---- Keyboard ---- */}
        {activeTab === 'keyboard' && (
          <motion.div
            key="keyboard"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="rounded-xl border p-6"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-5 text-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Key Performance Heatmap
              </h3>
              <KeyboardHeatmap keyStats={keyStats} />
              {Object.keys(keyStats).length === 0 && (
                <p
                  className="text-sm text-center mt-4"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  No keystroke data available for this user yet.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ---- History ---- */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="rounded-xl border p-6"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h3
                className="text-lg font-semibold mb-5"
                style={{ color: 'var(--color-text)' }}
              >
                Recent Test History
              </h3>
              {results.length === 0 ? (
                <p
                  className="text-sm text-center mt-4"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  No test history found for this user.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                        <th className="py-2 px-4 font-medium">Date</th>
                        <th className="py-2 px-4 font-medium">WPM</th>
                        <th className="py-2 px-4 font-medium">Accuracy</th>
                        <th className="py-2 px-4 font-medium">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <tr
                          key={r.id || idx}
                          style={{
                            borderBottom: '1px solid var(--color-border)',
                            color: 'var(--color-text)'
                          }}
                        >
                          <td className="py-3 px-4">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4 font-bold text-primary">{Math.round(r.wpm)}</td>
                          <td className="py-3 px-4">{Math.round(r.accuracy)}%</td>
                          <td className="py-3 px-4 capitalize">
                            {r.mode} {r.mode_value} • {r.content_mode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
