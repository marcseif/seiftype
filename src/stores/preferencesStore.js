import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme } from '../data/themes';

const usePreferencesStore = create(
  persist(
    (set, get) => ({
      theme: 'neon',
      customTheme: null,
      savedCustomThemes: [],
      font: "'JetBrains Mono', monospace",
      fontSize: 18,
      caretStyle: 'line',
      soundPack: 'silent',
      smoothCaret: true,
      showLiveWPM: true,
      showLiveAccuracy: true,
      showVirtualKeyboard: false,
      freedomMode: false,
      restartKey: 'tab_enter', // 'tab_enter', 'tab', 'esc'

      // Test config
      testMode: 'time',
      testModeValue: 30,
      contentMode: 'random',
        contentSubmode: 'english',

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme, get().customTheme);
      },

      setCustomTheme: (customTheme) => {
        set({ customTheme });
        if (get().theme === 'custom') {
          applyTheme('custom', customTheme);
        }
      },

      saveCustomTheme: (name, colors) => {
        const { savedCustomThemes } = get();
        const newTheme = { id: Date.now().toString(), name, colors };
        set({ savedCustomThemes: [...savedCustomThemes, newTheme] });
      },

      deleteCustomTheme: (id) => {
        const { savedCustomThemes } = get();
        set({ savedCustomThemes: savedCustomThemes.filter(t => t.id !== id) });
      },

      applySavedCustomTheme: (id) => {
        const themeToApply = get().savedCustomThemes.find(t => t.id === id);
        if (themeToApply) {
          get().setCustomTheme(themeToApply.colors);
          get().setTheme('custom');
        }
      },

      setFont: (font) => set({ font }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setSoundPack: (soundPack) => set({ soundPack }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setShowLiveWPM: (showLiveWPM) => set({ showLiveWPM }),
      setShowLiveAccuracy: (showLiveAccuracy) => set({ showLiveAccuracy }),
      setShowVirtualKeyboard: (showVirtualKeyboard) => set({ showVirtualKeyboard }),
      setFreedomMode: (freedomMode) => set({ freedomMode }),
      setRestartKey: (restartKey) => set({ restartKey }),

      setTestMode: (testMode) => set({ testMode }),
      setTestModeValue: (testModeValue) => set({ testModeValue }),
      setContentMode: (contentMode) => set({ contentMode }),
      setContentSubmode: (contentSubmode) => set({ contentSubmode }),
      setCodeLanguage: (codeLanguage) => set({ codeLanguage }),
      setQuoteLength: (quoteLength) => set({ quoteLength }),

      applyCurrentTheme: () => {
        const { theme, customTheme } = get();
        applyTheme(theme, customTheme);
      },

      // Bulk update from Supabase preferences
      loadFromSupabase: (prefs) => {
        if (!prefs) return;
        const updates = {};
        if (prefs.theme) updates.theme = prefs.theme;
        if (prefs.custom_theme) updates.customTheme = prefs.custom_theme;
        if (prefs.font) updates.font = prefs.font;
        if (prefs.font_size) updates.fontSize = prefs.font_size;
        if (prefs.caret_style) updates.caretStyle = prefs.caret_style;
        if (prefs.sound_pack) updates.soundPack = prefs.sound_pack;
        if (prefs.smooth_caret !== undefined) updates.smoothCaret = prefs.smooth_caret;
        if (prefs.show_live_wpm !== undefined) updates.showLiveWPM = prefs.show_live_wpm;
        if (prefs.show_live_accuracy !== undefined) updates.showLiveAccuracy = prefs.show_live_accuracy;
        if (prefs.show_virtual_keyboard !== undefined) updates.showVirtualKeyboard = prefs.show_virtual_keyboard;
        if (prefs.freedom_mode !== undefined) updates.freedomMode = prefs.freedom_mode;
        if (prefs.restart_key !== undefined) updates.restartKey = prefs.restart_key;
        set(updates);
        applyTheme(updates.theme || get().theme || 'neon', updates.customTheme || get().customTheme);
      },

      // Export to Supabase format
      toSupabaseFormat: () => {
        const state = get();
        return {
          theme: state.theme,
          custom_theme: state.customTheme || null,
          font: state.font,
          font_size: state.fontSize,
          caret_style: state.caretStyle,
          sound_pack: state.soundPack,
          smooth_caret: state.smoothCaret,
          show_live_wpm: state.showLiveWPM,
          show_live_accuracy: state.showLiveAccuracy,
          freedom_mode: state.freedomMode,
          
        };
      },
    }),
    {
      name: 'seiftype-preferences',
      partialize: (state) => ({
        theme: state.theme,
        customTheme: state.customTheme,
        savedCustomThemes: state.savedCustomThemes,
        font: state.font,
        fontSize: state.fontSize,
        caretStyle: state.caretStyle,
        soundPack: state.soundPack,
        smoothCaret: state.smoothCaret,
        showLiveWPM: state.showLiveWPM,
        showLiveAccuracy: state.showLiveAccuracy,
        showVirtualKeyboard: state.showVirtualKeyboard,
        freedomMode: state.freedomMode,
        restartKey: state.restartKey,
        testMode: state.testMode,
        testModeValue: state.testModeValue,
        contentMode: state.contentMode,
        contentSubmode: state.contentSubmode,
        codeLanguage: state.codeLanguage,
        quoteLength: state.quoteLength,
      }),
    }
  )
);

usePreferencesStore.getState().applyCurrentTheme();

export default usePreferencesStore;
