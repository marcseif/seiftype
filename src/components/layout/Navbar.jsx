import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import useUserStore from '../../stores/userStore';
import { signOut, getPendingFriendRequests, supabase } from '../../lib/supabase';
import { getRankTier } from '../../lib/elo';
import { calculateLevel, xpForLevel } from '../../lib/metrics';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/race', label: 'Race' },
  { to: '/daily', label: 'Daily' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile } = useUserStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
      const fetchRequests = () => {
        getPendingFriendRequests(user.id).then(({ data }) => {
          setPendingCount(data ? data.length : 0);
        });
      };

      fetchRequests();

      window.addEventListener('friends-updated', fetchRequests);

      const channel = supabase
        .channel('friendships_changes_nav')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` },
          fetchRequests
        )
        .subscribe();

      return () => {
        window.removeEventListener('friends-updated', fetchRequests);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    // Navigate home first so protected routes don't kick us to /auth
    navigate('/');
    
    try {
      await signOut();
      localStorage.clear();
      // Only do a hard reload after we know sign out completed and we're safely on the home page
      window.location.href = '/';
    } catch (err) {
      console.error('Signout error:', err);
    }
  };

  const getLevelInfo = (xp) => {
    const level = calculateLevel(xp || 0);
    const currXP = xpForLevel(level);
    const nextXP = xpForLevel(level + 1);
    const progress = Math.max(0, Math.min(1, (xp - currXP) / (nextXP - currXP)));
    return { level, progress, currentLevelXP: xp - currXP, totalNeededXP: nextXP - currXP, totalXP: xp };
  };

  const rank = profile ? getRankTier(profile.elo || 1000) : null;
  const xpInfo = profile ? getLevelInfo(profile.xp) : null;

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
          seiftype
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: active ? 'var(--color-highlight)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-md transition-colors hover:opacity-80"
                style={{ color: 'var(--color-text)' }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  >
                    {profile.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                
                <div className="flex flex-col items-start ml-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium leading-none">{profile.username}</span>
                    {rank && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded leading-none flex items-center gap-1" style={{ background: rank.color + '22', color: rank.color }}>
                        <span>{rank.icon}</span> <span>{rank.name}</span>
                      </span>
                    )}
                  </div>
                  {xpInfo && (
                    <div className="flex items-center gap-2 w-full mt-1.5" title={`Level ${xpInfo.level}: ${Math.round(xpInfo.currentLevelXP)} / ${Math.round(xpInfo.totalNeededXP)} XP`}>
                      <span className="text-[10px] font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                        lvl {xpInfo.level}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)', width: '60px' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out" 
                          style={{ background: 'var(--color-primary)', width: `${xpInfo.progress * 100}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-48 rounded-lg border z-50 py-1 shadow-lg"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    >
                      <Link
                        to={`/u/${profile.username}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:opacity-80"
                        style={{ color: 'var(--color-text)' }}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser size={14} /> Profile
                      </Link>
                      <Link
                        to="/friends"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:opacity-80"
                        style={{ color: 'var(--color-text)' }}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUsers size={14} /> Friends
                        {pendingCount > 0 && (
                          <span className="ml-auto flex items-center justify-center min-w-[16px] h-4 rounded-full text-[10px] font-bold" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:opacity-80"
                        style={{ color: 'var(--color-text)' }}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiSettings size={14} /> Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:opacity-80"
                        style={{ color: 'var(--color-error)' }}
                      >
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth"
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--color-text)' }}
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2"
          style={{ color: 'var(--color-text)' }}
        >
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={{
                    color: location.pathname === link.to ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to={`/u/${profile?.username}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--color-text)' }}>
                    Profile
                  </Link>
                  <Link to="/friends" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm flex items-center justify-between" style={{ color: 'var(--color-text)' }}>
                    Friends
                    {pendingCount > 0 && (
                      <span className="flex items-center justify-center min-w-[16px] h-4 rounded-full text-[10px] font-bold px-1" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--color-text)' }}>
                    Settings
                  </Link>
                  <button onClick={handleSignOut} className="px-3 py-2 rounded-md text-sm text-left" style={{ color: 'var(--color-error)' }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--color-primary)' }}>
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
