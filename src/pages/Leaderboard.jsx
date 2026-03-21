import { useState, useEffect } from 'react';
import { getGlobalLeaderboard } from '../lib/supabase';
import { getRankTier } from '../lib/elo';
import RankBadge from '../components/profile/RankBadge';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import { Link } from 'react-router-dom';
import useUserStore from '../stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard() {
  const { user } = useUserStore();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await getGlobalLeaderboard(50);
        if (mounted) {
          setPlayers(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>Leaderboard</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Top {players.length} typists ranked by ELO
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {/* Header */}
        <div
          className="grid grid-cols-[50px_1fr_100px_80px_80px] gap-2 px-4 py-3 text-xs font-semibold border-b"
          style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
        >
          <span>Rank</span>
          <span>Player</span>
          <span className="text-center">Rating</span>
          <span className="text-right">Level</span>
          <span className="text-right">Tests</span>
        </div>

        {/* Rows */}
        {players.map((player, index) => {
          const rank = getRankTier(player.elo);
          const isCurrentUser = player.id === user?.id;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="grid grid-cols-[50px_1fr_100px_80px_80px] gap-2 px-4 py-3 items-center border-b last:border-b-0"
              style={{
                borderColor: 'var(--color-border)',
                background: isCurrentUser ? 'var(--color-highlight)' : 'transparent',
              }}
            >
              {/* Rank */}
              <span
                className="text-sm font-bold"
                style={{ color: index < 3 ? medalColors[index] : 'var(--color-text-secondary)' }}
              >
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </span>

              {/* Player */}
              <Link
                to={`/u/${player.username}`}
                className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: rank.color + '33', color: rank.color }}
                  >
                    {player.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: isCurrentUser ? 'var(--color-primary)' : 'var(--color-text)' }}
                >
                  {player.username}
                </span>
              </Link>

              {/* Rating */}
              <div className="text-center">
                <RankBadge elo={player.elo} size="sm" showProgress={false} />
              </div>

              {/* Level */}
              <div className="text-right">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {player.level}
                </span>
              </div>

              {/* Tests */}
              <div className="text-right">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {player.tests_completed}
                </span>
              </div>
            </motion.div>
          );
        })}

        {players.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No players yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}
