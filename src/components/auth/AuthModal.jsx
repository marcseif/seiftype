import { useState } from 'react';
import { FiX, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaDiscord } from 'react-icons/fa';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithDiscord, resetPasswordForEmail } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!email || !password) return 'Email and password are required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (mode === 'signup') {
      if (!username) return 'Username is required';
      if (username.length < 3) return 'Username must be at least 3 characters';
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'reset') {
      return handleResetPassword(e);
    }
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithEmail(email, password, username);
        
        if (error) {
          if (error.status === 429) {
            throw new Error('Too many sign up attempts. Please try again later.');
          }
          if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
            throw new Error('An account with this email already exists.');
          }
          throw error;
        }

        // Supabase returns a fake success object if email enumeration protection is on,
        // but identities will be empty (or missing) if the user actually already exists.
        if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error('An account with this email already exists.');
        }

        setSuccess('Account created! Please check your email to verify your account.');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.status === 429) {
            throw new Error('Too many login attempts. Please try again later.');
          }
          throw error;
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      if (mode !== 'signup') setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    }
  };

  const handleDiscord = async () => {
    try {
      const { error } = await signInWithDiscord();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Discord sign in failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      // Because Supabase handles "Doesn't Exist" with the same fake success (when email enumeration is on),
      // we check if error was actually thrown (which requires Email Enumeration Protection to be OFF in dashboard).
      if (error) throw error;
      setSuccess('If an account exists, a reset link has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            layout
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl relative overflow-hidden"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {mode === 'reset' ? 'Reset Password' : mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Mode Toggle */}
            {mode !== 'reset' && (
            <div className="flex rounded-lg mb-6 p-1" style={{ background: 'var(--color-bg)' }}>
              {['signin', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                  style={{
                    background: mode === m ? 'var(--color-primary)' : 'transparent',
                    color: mode === m ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}
            
            {/* Success */}
            {success && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.9 0.05 140 / 0.2)', color: 'var(--color-success)' }}>
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {mode === 'signup' && (
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} size={16} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--color-bg)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} size={16} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  autoFocus={mode === 'signin'}
                />
              </div>

              {mode !== 'reset' && (
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} size={16} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {loading ? 'Loading...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-xs text-center mt-2 hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Forgot Password?
                </button>
              )}
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-xs text-center mt-2 hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Back to Sign In
                </button>
              )}
            </form>

            {/* Divider */}
            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>

                <div className="flex flex-col gap-2">
                  {/* Google */}
                  <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <FcGoogle size={18} />
                    Continue with Google
                  </button>
                  
                  {/* Discord */}
                  <button
                    onClick={handleDiscord}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ borderColor: 'var(--color-border)', color: '#fff', backgroundColor: '#5865F2' }}
                  >
                    <FaDiscord size={18} />
                    Continue with Discord
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
