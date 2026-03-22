import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import usePreferencesStore from '../stores/preferencesStore';
import useUserStore from '../stores/userStore';
import { updatePreferences, uploadAvatarFile, linkOAuthIdentity, unlinkOAuthIdentity, updateUserPassword } from '../lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { FaDiscord } from 'react-icons/fa';
import { THEMES, FONTS, CARET_STYLES, SOUND_PACKS, applyTheme } from '../data/themes';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const prefs = usePreferencesStore();
  const { user, profile, updateUserProfile } = useUserStore();
  const location = useLocation();

  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Left deliberately blank, reset password handled via /reset-password route now
  }, [location]);

  // Auto-save preferences map when individual settings change
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(() => {
      let supabasePrefs = usePreferencesStore.getState().toSupabaseFormat();
        for (let key in supabasePrefs) {
          if (supabasePrefs[key] === undefined) supabasePrefs[key] = null;
        }
      console.log('Sending to Supabase:', supabasePrefs); updatePreferences(user.id, supabasePrefs).then(res => { if(res.error) console.error('Supabase error:', res.error); }).catch(err => console.error('Auto-sync failed:', err));
    }, 1000); // debounce slightly
    return () => clearTimeout(timeoutId);
  }, [
    user,
    prefs.theme, prefs.customTheme, prefs.font, prefs.fontSize,
    prefs.caretStyle, prefs.soundPack, prefs.soundVolume, prefs.smoothCaret, prefs.showLiveWPM,
    prefs.showLiveAccuracy, prefs.showVirtualKeyboard, prefs.freedomMode,
    prefs.restartKey
  ]);

  // Custom theme editor state
  const [customColors, setCustomColors] = useState(prefs.customTheme || {
    bg: '#1a1a2e',
    text: '#e4e4e7',
    primary: '#e94560',
    error: '#ef4444',
    caret: '#e94560',
    surface: '#0f3460',
  });
  
  const [newThemeName, setNewThemeName] = useState('');

  const [prevProfileState, setPrevProfileState] = useState({ username: profile?.username, avatar: profile?.avatar_url });

  if (profile?.username !== prevProfileState.username || profile?.avatar_url !== prevProfileState.avatar) {
    setPrevProfileState({ username: profile?.username, avatar: profile?.avatar_url });
    setUsername(profile?.username || '');
    setAvatarUrl(profile?.avatar_url || '');
  }

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await updateUserPassword(newPassword);
    if (error) {
      toast.error(error.message || 'Failed to update password');
    } else {
      toast.success('Password updated successfully!');
      setNewPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const handleProfileUpdate = async () => {
    let finalAvatarUrl = avatarUrl;
    
    // If a new local file was selected, upload it FIRST here
    if (avatarFile) {
      setUploadingAvatar(true);
      const { data: uploadData, error: uploadError } = await uploadAvatarFile(avatarFile, user.id);
      if (uploadError) {
        toast.error('Failed to upload image');
        setUploadingAvatar(false);
        return;
      }
      finalAvatarUrl = uploadData.publicUrl;
      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null); // clear local file
      setUploadingAvatar(false);
    }

    const updates = {};
    if (username.trim() && username !== profile?.username) {
      if (username.length < 3) {
        toast.error('Username must be at least 3 characters');
        return;
      }
      updates.username = username.trim();
    }

    if (finalAvatarUrl.trim() !== (profile?.avatar_url || '')) {
      updates.avatar_url = finalAvatarUrl.trim();
    }

    if (Object.keys(updates).length === 0 && !avatarFile) return;

    const { error } = await updateUserProfile(updates);
    if (error) {
      toast.error(error.message || 'Failed to update profile');
    } else {
      toast.success('Profile updated');
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be < 2MB');
      return;
    }

    // Set preview URL and store the file locally
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleLinkProvider = async (provider) => {
    try {
      const { error } = await linkOAuthIdentity(provider);
      if (error) throw error;
      // It will redirect to the provider here
    } catch (error) {
      toast.error(error.message || `Failed to link ${provider}`);
    }
  };

  const handleUnlinkProvider = async (provider) => {
    try {
      const identity = user?.identities?.find(i => i.provider === provider);
      if (!identity) throw new Error('Identity not found');
      
      const { error } = await unlinkOAuthIdentity(identity.identity_id);
      if (error) throw error;
      toast.success(`${provider} account unlinked successfully! Reloading...`);
      setTimeout(() => window.location.reload(), 1500); // Reload to fetch updated identities
    } catch (error) {
      toast.error(error.message || `Failed to unlink ${provider}`);
    }
  };

  const providers = user?.app_metadata?.providers || [];
  const linkedGoogle = providers.includes('google');
  const linkedDiscord = providers.includes('discord');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>Settings</h1>

      {/* Profile Settings */}
      {user && (
        <Section title="Profile">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 items-center mt-2">
              <div className="shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" style={{ borderColor: 'var(--color-border)' }} />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-dashed flex items-center justify-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    none
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                </button>
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Max size: 2MB (JPG, PNG)</span>
              </div>
            </div>
            <div className="mt-2">
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Update Profile
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Connections (Linked Accounts) */}
      {user && (
        <Section title="Connections">
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Link your social accounts to log in flexibly.
            </p>
            <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <FcGoogle size={24} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Google</span>
              </div>
              {linkedGoogle ? (
                <button
                  onClick={() => handleUnlinkProvider('google')}
                  className="px-4 py-1.5 rounded text-sm font-medium transition-opacity"
                  style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}
                  title="Unlink Google"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider('google')}
                  className="px-4 py-1.5 rounded text-sm font-medium transition-opacity"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  Link Account
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <FaDiscord size={24} style={{ color: '#5865F2' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Discord</span>
              </div>
              {linkedDiscord ? (
                <button
                  onClick={() => handleUnlinkProvider('discord')}
                  className="px-4 py-1.5 rounded text-sm font-medium transition-opacity"
                  style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}
                  title="Unlink Discord"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider('discord')}
                  className="px-4 py-1.5 rounded text-sm font-medium transition-opacity"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  Link Account
                </button>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Theme */}
      <Section title="Theme">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => { prefs.setTheme(key); applyTheme(key); }}
              className="rounded-lg p-3 border-2 transition-all text-center"
              style={{
                background: theme.colors.bg,
                borderColor: prefs.theme === key ? theme.colors.primary : 'transparent',
              }}
            >
              <div className="w-full h-3 rounded-full mb-1.5" style={{ background: theme.colors.primary }} />
              <div className="text-[10px] font-medium" style={{ color: theme.colors.text }}>
                {theme.name}
              </div>
            </button>
          ))}
        </div>

        {/* Custom Theme */}
        <div className="mt-4">
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => {
                prefs.setTheme('custom');
                if (prefs.customTheme) {
                  setCustomColors(prefs.customTheme);
                  applyTheme('custom', prefs.customTheme);
                } else {
                  prefs.setCustomTheme(customColors);
                  applyTheme('custom', customColors);
                }
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{
                borderColor: prefs.theme === 'custom' && !prefs.savedCustomThemes?.some(t => t.colors === prefs.customTheme) ? 'var(--color-primary)' : 'var(--color-border)',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
              }}
            >
              Current Custom Theme
            </button>

            {prefs.savedCustomThemes && prefs.savedCustomThemes.map(saved => (
              <div key={saved.id} className="relative group flex items-center">
                <button
                  onClick={() => {
                    setCustomColors(saved.colors);
                    prefs.applySavedCustomTheme(saved.id);
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-l-lg border border-r-0"
                  style={{
                    borderColor: prefs.theme === 'custom' && prefs.customTheme === saved.colors ? 'var(--color-primary)' : 'var(--color-border)',
                    color: 'var(--color-text)',
                    background: saved.colors.bg,
                  }}
                >
                  <span style={{ color: saved.colors.primary }}>●</span> {saved.name}
                </button>
                <button
                  onClick={() => prefs.deleteCustomTheme(saved.id)}
                  className="text-xs font-medium px-2 py-1.5 rounded-r-lg border opacity-50 hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all"
                  style={{
                    borderColor: prefs.theme === 'custom' && prefs.customTheme === saved.colors ? 'var(--color-primary)' : 'var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {prefs.theme === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {Object.entries(customColors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => {
                        const updated = { ...customColors, [key]: e.target.value };
                        setCustomColors(updated);
                        prefs.setCustomTheme(updated);
                        applyTheme('custom', updated);
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>{key}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Theme name..."
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border text-xs outline-none flex-1 max-w-[200px]"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={() => {
                    if (!newThemeName.trim()) {
                      toast.error('Please enter a theme name');
                      return;
                    }
                    prefs.saveCustomTheme(newThemeName.trim(), customColors);
                    setNewThemeName('');
                    toast.success('Theme saved!');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  Save Theme
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Font */}
      <Section title="Font">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => prefs.setFont(f.value)}
              className="px-3 py-2.5 rounded-lg border text-sm transition-all"
              style={{
                fontFamily: f.value,
                background: prefs.font === f.value ? 'var(--color-highlight)' : 'var(--color-bg)',
                borderColor: prefs.font === f.value ? 'var(--color-primary)' : 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
            Font Size: {prefs.fontSize}px
          </label>
          <input
            type="range"
            min={14}
            max={28}
            value={prefs.fontSize}
            onChange={(e) => prefs.setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </Section>

      {/* Caret */}
      <Section title="Caret Style">
        <div className="flex gap-2 flex-wrap">
          {CARET_STYLES.map((c) => (
            <button
              key={c.value}
              onClick={() => prefs.setCaretStyle(c.value)}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: prefs.caretStyle === c.value ? 'var(--color-highlight)' : 'var(--color-bg)',
                borderColor: prefs.caretStyle === c.value ? 'var(--color-primary)' : 'var(--color-border)',
                color: prefs.caretStyle === c.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.smoothCaret}
              onChange={(e) => prefs.setSmoothCaret(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Smooth caret animation</span>
          </label>
        </div>
      </Section>

      {/* Sound */}
      <Section title="Sound">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {SOUND_PACKS.map((s) => (
              <button
                key={s.value}
                onClick={() => prefs.setSoundPack(s.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: prefs.soundPack === s.value ? 'var(--color-highlight)' : 'var(--color-bg)',
                  borderColor: prefs.soundPack === s.value ? 'var(--color-primary)' : 'var(--color-border)',
                  color: prefs.soundPack === s.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
          {prefs.soundPack !== 'silent' && (
            <div className="flex items-center gap-4 max-w-xs">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={prefs.soundVolume ?? 1.0}
                onChange={(e) => prefs.setSoundVolume(parseFloat(e.target.value))}
                className="w-full flex-1"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="text-sm w-8 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                {Math.round((prefs.soundVolume ?? 1.0) * 100)}%
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* Display Options */}
      <Section title="Display">
        <div className="space-y-3">
          <Toggle label="Show live WPM" checked={prefs.showLiveWPM} onChange={prefs.setShowLiveWPM} />
          <Toggle label="Show live accuracy" checked={prefs.showLiveAccuracy} onChange={prefs.setShowLiveAccuracy} />
          <Toggle label="Show virtual keyboard layout" checked={prefs.showVirtualKeyboard} onChange={prefs.setShowVirtualKeyboard} />            <Toggle label="Show cat paws indicator" checked={prefs.showCatPaws} onChange={prefs.setShowCatPaws} />          <Toggle label="Freedom mode (no error correction)" checked={prefs.freedomMode} onChange={prefs.setFreedomMode} />
        </div>
      </Section>

      {/* Restart Key */}
      <Section title="Restart Shortcut">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'tab_enter', label: 'Tab + Enter' },
            { value: 'tab', label: 'Tab' },
            { value: 'esc', label: 'Escape' }
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => prefs.setRestartKey(mode.value)}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: (prefs.restartKey || 'tab_enter') === mode.value ? 'var(--color-highlight)' : 'var(--color-bg)',
                borderColor: (prefs.restartKey || 'tab_enter') === mode.value ? 'var(--color-primary)' : 'var(--color-border)',
                color: (prefs.restartKey || 'tab_enter') === mode.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Security */}
      {user && user.app_metadata?.provider === 'email' && (
        <Section title="Security">
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Change your password.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>New Password</label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || newPassword.length < 8}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--color-error)', color: '#fff' }}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </Section>
      )}
      </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
      <div
        className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </div>
    </label>
  );
}
