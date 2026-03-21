import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePreferencesStore from '../../stores/preferencesStore';
import CatPaws from './CatPaws';

const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['caps lock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'enter'],
  ['shift-l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift-r'],
  ['ctrl-l', 'win-l', 'alt-l', ' ', 'alt-r', 'win-r', 'menu', 'ctrl-r'],
];

const SHIFT_MAP = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/'
};

const FINGER_MAP = {
  // Left Pinky
  'q': 'pinky-l', 'a': 'pinky-l', 'z': 'pinky-l', '1': 'pinky-l', '`': 'pinky-l', 'tab': 'pinky-l', 'caps lock': 'pinky-l', 'shift-l': 'pinky-l', 'ctrl-l': 'pinky-l',
  // Left Ring
  'w': 'ring-l', 's': 'ring-l', 'x': 'ring-l', '2': 'ring-l', 'win-l': 'ring-l',
  // Left Middle
  'e': 'middle-l', 'd': 'middle-l', 'c': 'middle-l', '3': 'middle-l', 'alt-l': 'middle-l',
  // Left Index
  'r': 'index-l', 'f': 'index-l', 'v': 'index-l', '4': 'index-l',
  't': 'index-l', 'g': 'index-l', 'b': 'index-l', '5': 'index-l',
  // Right Index
  'y': 'index-r', 'h': 'index-r', 'n': 'index-r', '6': 'index-r',
  'u': 'index-r', 'j': 'index-r', 'm': 'index-r', '7': 'index-r',
  // Right Middle
  'i': 'middle-r', 'k': 'middle-r', ',': 'middle-r', '8': 'middle-r', 'alt-r': 'middle-r',
  // Right Ring
  'o': 'ring-r', 'l': 'ring-r', '.': 'ring-r', '9': 'ring-r', 'win-r': 'ring-r',
  // Right Pinky
  'p': 'pinky-r', ';': 'pinky-r', '/': 'pinky-r', '0': 'pinky-r',
  '[': 'pinky-r', ']': 'pinky-r', '\'': 'pinky-r', '-': 'pinky-r', '=': 'pinky-r', '\\': 'pinky-r', 'backspace': 'pinky-r', 'enter': 'pinky-r', 'shift-r': 'pinky-r', 'ctrl-r': 'pinky-r', 'menu': 'pinky-r',
  // Thumbs
  ' ': 'thumb'
};

const FINGER_COLORS = {
  'pinky-l': 'rgba(239, 68, 68, 0.4)',  // Red
  'ring-l': 'rgba(249, 115, 22, 0.4)',  // Orange
  'middle-l': 'rgba(234, 179, 8, 0.4)', // Yellow
  'index-l': 'rgba(34, 197, 94, 0.4)',  // Green
  'index-r': 'rgba(6, 182, 212, 0.4)',  // Cyan
  'middle-r': 'rgba(59, 130, 246, 0.4)',// Blue
  'ring-r': 'rgba(168, 85, 247, 0.4)',  // Purple
  'pinky-r': 'rgba(236, 72, 153, 0.4)', // Pink
  'thumb': 'rgba(255, 255, 255, 0.2)',  // White
};

export default function VirtualKeyboard({ nextChar, scale = 1, forceShowKeys = false }) {
  const showCatPaws = usePreferencesStore((s) => s.showCatPaws);
  const showVirtualKeyboard = usePreferencesStore((s) => s.showVirtualKeyboard);
  const showKeys = forceShowKeys || showVirtualKeyboard;
  const [activeKeys, setActiveKeys] = useState(new Set());

  useEffect(() => {
    const normalizeKey = (e) => {
      let key = e.key.toLowerCase();
      if (key === 'shift') key = e.code === 'ShiftLeft' ? 'shift-l' : 'shift-r';
      if (key === 'control') key = e.code === 'ControlLeft' ? 'ctrl-l' : 'ctrl-r';
      if (key === 'alt') key = e.code === 'AltLeft' ? 'alt-l' : 'alt-r';
      if (key === 'meta') key = e.code === 'MetaLeft' ? 'win-l' : 'win-r';
      if (key === 'capslock') key = 'caps lock';
      return key;
    };

    const handleKeyDown = (e) => setActiveKeys((prev) => new Set(prev).add(normalizeKey(e)));
    const handleKeyUp = (e) => setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(normalizeKey(e));
      return next;
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const { targetBaseKey, targetShift } = useMemo(() => {
    if (!nextChar) return {};
    const isCapital = /^[A-Z]$/.test(nextChar);
    const isShiftSymbol = nextChar in SHIFT_MAP;
    const requiresShift = isCapital || isShiftSymbol;
    const baseKey = isCapital ? nextChar.toLowerCase() : (isShiftSymbol ? SHIFT_MAP[nextChar] : nextChar.toLowerCase());
    
    if (!requiresShift) return { targetBaseKey: baseKey };

    const fingerId = FINGER_MAP[baseKey];
    const isLeftHand = fingerId?.endsWith('-l');
    return { targetBaseKey: baseKey, targetShift: isLeftHand ? 'shift-r' : 'shift-l' };
  }, [nextChar]);

  // Helper to format finger text
  const fingerText = useMemo(() => {
    if (!nextChar || !targetBaseKey) return null;
    const baseFingerId = FINGER_MAP[targetBaseKey];
    if (!baseFingerId) return null;
    
    const parts = baseFingerId.split('-');
    const hand = parts[1] === 'l' ? 'Left' : 'Right';
    const finger = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    
    let text = `Use ${hand} ${finger}`;
    if (baseFingerId === 'thumb') text = 'Use Thumb';
    
    if (targetShift) {
       const shiftHand = targetShift === 'shift-l' ? 'Left' : 'Right';
       text += ` + ${shiftHand} Pinky (Shift)`;
    }
    return text;
  }, [nextChar, targetBaseKey, targetShift]);

  return (
    <div 
      className="flex flex-col items-center gap-2 mt-8 opacity-70"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      {showKeys && (
        <div className="mt-2 flex flex-col gap-2">
          {KEYBOARD_LAYOUT.map((row, rIdx) => (
        <div key={rIdx} className="flex gap-2">
          {row.map((key) => {
            const isNext = targetBaseKey === key || targetShift === key;
            const isPressed = activeKeys.has(key);
            const fingerId = FINGER_MAP[key];
            const fingerColor = FINGER_COLORS[fingerId] || 'rgba(255, 255, 255, 0.1)';

            const displayLabel = (() => {
               if (key === ' ') return 'SPACE';
               if (key.startsWith('shift')) return 'SHIFT';
               if (key.startsWith('ctrl')) return 'CTRL';
               if (key.startsWith('alt')) return 'ALT';
               if (key.startsWith('win')) return 'WIN';
               return key;
            })();

            let widthClass = 'w-10';
            if (key === ' ') widthClass = 'w-[20rem]';
            else if (key === 'backspace') widthClass = 'w-16';
            else if (key === 'tab') widthClass = 'w-14';
            else if (key === '\\') widthClass = 'w-12';
            else if (key === 'caps lock') widthClass = 'w-[4.5rem]';
            else if (key === 'enter') widthClass = 'w-[4.5rem]';
            else if (key.startsWith('shift')) widthClass = 'w-[5.5rem]';
            else if (['ctrl-l', 'ctrl-r', 'alt-l', 'alt-r', 'win-l', 'win-r', 'menu'].includes(key)) widthClass = 'w-12';

            return (
              <motion.div
                key={key}
                animate={{
                  scale: isPressed ? 0.9 : 1,
                  backgroundColor: isPressed 
                    ? 'var(--color-primary)' 
                    : isNext 
                      ? fingerColor 
                      : 'var(--color-bg-secondary)',
                  borderColor: isNext ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isPressed ? '#fff' : 'var(--color-text)',
                }}
                transition={{ duration: 0.1 }}
                className={`flex items-center justify-center rounded-lg border font-mono text-xs uppercase h-10 ${widthClass}`}
                style={{
                  borderWidth: isNext ? 2 : 1,
                  boxShadow: isNext ? '0 0 10px var(--color-primary)' : 'none',
                }}
              >
                {displayLabel}
              </motion.div>
            );
          })}
        </div>
      ))}
        </div>
      )}
      {showCatPaws ? (
        <CatPaws activeFingerId={targetBaseKey ? FINGER_MAP[targetBaseKey] : null} />
      ) : (
        <div className="h-6 mt-4 flex items-center justify-center font-mono text-sm font-bold uppercase transition-all" style={{ color: 'var(--color-primary)' }}>
          {fingerText || <span className="opacity-0">.</span>}
        </div>
      )}
    </div>
  );
}
