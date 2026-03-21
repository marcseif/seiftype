import { create } from 'zustand';
import { supabase, getProfile, updateProfile, getPreferences } from '../lib/supabase';
import usePreferencesStore from './preferencesStore';

const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await getProfile(session.user.id);
        const { data: prefs } = await getPreferences(session.user.id);
        if (prefs) {
            usePreferencesStore.getState().loadFromSupabase(prefs);
        }
        set({ user: session.user, profile, session, loading: false });
      } else {
        set({ loading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await getProfile(session.user.id);
          const { data: prefs } = await getPreferences(session.user.id);
          if (prefs) {
            usePreferencesStore.getState().loadFromSupabase(prefs);
          }
          set({ user: session.user, profile, session });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, session: null });
        }
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data: profile } = await getProfile(user.id);
    if (profile) set({ profile });
  },

  updateUserProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await updateProfile(user.id, updates);
    if (data) set({ profile: data });
    return { data, error };
  },

  addXP: (amount) => {
    set((state) => {
      if (!state.profile) return state;
      const newXP = state.profile.xp + amount;
      const newLevel = Math.max(1, Math.min(100, Math.floor(Math.sqrt(newXP / 50)) + 1));
      return {
        profile: { ...state.profile, xp: newXP, level: newLevel },
      };
    });
  },

  updateElo: (newElo) => {
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: { ...state.profile, elo: newElo },
      };
    });
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));

export default useUserStore;
