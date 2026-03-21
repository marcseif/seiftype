import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="max-w-6xl mx-auto px-4 py-6"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          },
          success: {
            iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface)' },
          },
          error: {
            iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-surface)' },
          },
        }}
      />
    </div>
  );
}
