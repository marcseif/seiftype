import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Race from './pages/Race';
import Daily from './pages/Daily';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Lessons from './pages/Lessons';
import Friends from './pages/Friends';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useUserStore from './stores/userStore';
import CatLoadingScreen from './components/ui/CatLoadingScreen';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function App() {
  const initialize = useUserStore((s) => s.initialize);
  const loading = useUserStore((s) => s.loading);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);

  useEffect(() => {
    // Check for hash errors from Supabase (e.g. expired OTP token)
    if (window.location.hash && window.location.hash.includes('error=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDescription = hashParams.get('error_description');
      
      if (errorDescription) {
        // Wait a slight moment so toast container is mounted
        setTimeout(() => {
          toast.error(errorDescription.replace(/\+/g, ' '), { duration: 5000 });
        }, 500);
      }
      
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Start initialization fetch
    initialize();

    // Enforce a minimum of 1.5 seconds so the cute cat loading screen is actually seen 
    // and layout doesn't flicker violently if data comes back in 50ms
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [initialize]);

  const showLoading = loading || !minLoadingTimePassed;

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoading ? (
          <CatLoadingScreen key="loading" />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full min-h-screen"
          >
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/u/:username" element={<Profile />} />
                  <Route path="/race" element={<Race />} />
                  <Route path="/daily" element={<Daily />} />
                  <Route path="/lessons" element={<Lessons />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
