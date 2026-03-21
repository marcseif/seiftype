/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Core typing engine hook for seiftype.
 *
 * Manages character-by-character input tracking, word progression, live WPM/accuracy,
 * keystroke logging, and timer logic for both "time" and "words" modes.
 *
 * All fast-mutating state lives in refs to avoid per-keystroke re-renders.
 * A requestAnimationFrame loop copies ref values into React state at ~60 fps
 * so the UI stays smooth without stalling the engine.
 */
export default function useTypingEngine(words, mode, modeValue, onComplete) {
  // ---------------------------------------------------------------------------
  // Derived constants
  // ---------------------------------------------------------------------------
  const wordsArray = useRef([]);
  const charList = useRef([]); // flat list of expected characters

  // ---------------------------------------------------------------------------
  // Mutable engine state (refs) -- updated on every keystroke, never trigger renders
  // ---------------------------------------------------------------------------
  const charIndexRef = useRef(0);
  const wordIndexRef = useRef(0);
  const inputRef = useRef(''); // characters typed for the current word
  const charStatesRef = useRef([]); // {char, state} per character
  const isActiveRef = useRef(false);
  const isFinishedRef = useRef(false);

  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0); // every physical key (for accuracy denominator)
  const extraCharsRef = useRef([]); // extra chars typed past word length per word index

  const startTimeRef = useRef(null);
  const lastKeyTimeRef = useRef(null);
  const keystrokeLogRef = useRef([]);

  const timerRef = useRef(null); // setInterval id for time-mode countdown
  const rafRef = useRef(null);
  const timeLeftRef = useRef(mode === 'time' ? modeValue : 0);
  const elapsedRef = useRef(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // ---------------------------------------------------------------------------
  // React state -- written at ~60 fps by the RAF loop so the UI can read them
  // ---------------------------------------------------------------------------
  function buildDisplayState() {
    const elapsed = elapsedRef.current;
    const correctChars = correctCharsRef.current;
    const totalKeystrokes = totalKeystrokesRef.current;

    const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;
    const rawWpm = elapsed > 0 ? Math.round((totalKeystrokesRef.current / 5) / (elapsed / 60)) : 0;
    const accuracy = totalKeystrokes > 0
      ? Math.round((correctChars / totalKeystrokes) * 10000) / 100
      : 100;

    const currentWord = wordsArray.current[wordIndexRef.current] || '';
    const posInWord = inputRef.current.length;
    let nextExpectedChar = '';
    if (posInWord < currentWord.length) {
      nextExpectedChar = currentWord[posInWord];
    } else if (wordIndexRef.current < wordsArray.current.length - 1) {
      nextExpectedChar = ' ';
    }

    return {
      input: inputRef.current,
      charIndex: charIndexRef.current,
      wordIndex: wordIndexRef.current,
      currentWord,
      nextExpectedChar,
      words: wordsArray.current,
      charStates: charStatesRef.current,
      isActive: isActiveRef.current,
      isFinished: isFinishedRef.current,
      timeLeft: timeLeftRef.current,
      elapsed,
      wpm,
      rawWpm,
      accuracy,
      correctChars,
      incorrectChars: incorrectCharsRef.current,
      totalChars: totalKeystrokesRef.current,
      keystrokeLog: keystrokeLogRef.current,
    };
  }

  const [displayState, setDisplayState] = useState({
    input: '',
    charIndex: 0,
    wordIndex: 0,
    currentWord: '',
    words: [],
    charStates: [],
    isActive: false,
    isFinished: false,
    timeLeft: mode === 'time' ? modeValue : 0,
    elapsed: 0,
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    keystrokeLog: [],
  });

  // ---------------------------------------------------------------------------
  // Initialise / reset internal structures whenever the word string changes
  // ---------------------------------------------------------------------------
  const init = useCallback(() => {
    const arr = (words || '').split(' ').filter(Boolean);
    wordsArray.current = arr;

    // Build flat character list with space separators between words
    const chars = [];
    arr.forEach((word, wi) => {
      for (const ch of word) {
        chars.push({ char: ch, state: 'pending', wordIndex: wi });
      }
      // Add a space between words (not after the last word)
      if (wi < arr.length - 1) {
        chars.push({ char: ' ', state: 'pending', wordIndex: wi });
      }
    });
    charList.current = chars;
    charStatesRef.current = chars.map((c) => ({ char: c.char, state: 'pending' }));

    charIndexRef.current = 0;
    wordIndexRef.current = 0;
    inputRef.current = '';
    isActiveRef.current = false;
    isFinishedRef.current = false;
    correctCharsRef.current = 0;
    incorrectCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    extraCharsRef.current = [];
    startTimeRef.current = null;
    lastKeyTimeRef.current = null;
    keystrokeLogRef.current = [];
    timeLeftRef.current = mode === 'time' ? modeValue : 0;
    elapsedRef.current = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setDisplayState(buildDisplayState());
  }, [words, mode, modeValue]);

  // Run init whenever the inputs change
  useEffect(() => {
    init();
  }, [init]);

  // ---------------------------------------------------------------------------
  // RAF display loop and Finish helpers
  // ---------------------------------------------------------------------------
  const stopRAF = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (isFinishedRef.current) return;
    isActiveRef.current = false;
    isFinishedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Final elapsed snapshot
    if (startTimeRef.current) {
      elapsedRef.current = (performance.now() - startTimeRef.current) / 1000;
      if (mode === 'time') {
        // Clamp to the mode value so WPM is calculated against the intended duration
        elapsedRef.current = Math.min(elapsedRef.current, modeValue);
        timeLeftRef.current = 0;
      }
    }

    // One last display sync
    setDisplayState(buildDisplayState());
    stopRAF();

    // Fire callback
    if (onCompleteRef.current) {
      const final = buildDisplayState();
      onCompleteRef.current(final);
    }
  }, [mode, modeValue, stopRAF]);

  const startRAF = useCallback(() => {
    const tick = () => {
      if (isActiveRef.current && startTimeRef.current) {
        elapsedRef.current = (performance.now() - startTimeRef.current) / 1000;

        if (mode === 'time') {
          const remaining = Math.max(0, modeValue - elapsedRef.current);
          timeLeftRef.current = remaining;
          if (remaining <= 0) {
            finish();
            return;
          }
        }
      }
      setDisplayState(buildDisplayState());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [mode, modeValue, finish]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRAF();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopRAF]);

  // ---------------------------------------------------------------------------
  // Start / finish helpers
  // ---------------------------------------------------------------------------
  const startEngine = useCallback(() => {
    if (isActiveRef.current || isFinishedRef.current) return;
    isActiveRef.current = true;
    startTimeRef.current = performance.now();
    lastKeyTimeRef.current = performance.now();
    startRAF();
  }, [startRAF]);

  // ---------------------------------------------------------------------------
  // Get the flat char index pointing to the start of a given word
  // ---------------------------------------------------------------------------
  function getWordStartIndex(targetWordIndex) {
    let idx = 0;
    for (let wi = 0; wi < targetWordIndex; wi++) {
      idx += wordsArray.current[wi].length; // word chars
      if (extraCharsRef.current[wi]) {
        idx += extraCharsRef.current[wi].length;
      }
      if (wi < wordsArray.current.length - 1) idx += 1; // space
    }
    return idx;
  }

  // ---------------------------------------------------------------------------
  // Core key handler
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback((e) => {
    // Ignore modifier-only and navigation keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (['Shift', 'CapsLock', 'Tab', 'Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    if (isFinishedRef.current) return;

    // Auto-start on first meaningful keypress
    if (!isActiveRef.current && e.key !== 'Backspace') {
      startEngine();
    }

    const now = performance.now();
    const delay = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
    lastKeyTimeRef.current = now;

    const currentWord = wordsArray.current[wordIndexRef.current] || '';
    const chars = charStatesRef.current;

    // -------------------------------------------------------------------------
    // Backspace
    // -------------------------------------------------------------------------
    if (e.key === 'Backspace') {
      e.preventDefault();

      // If there are extra characters past the word, remove the last extra first
      const wordExtras = extraCharsRef.current[wordIndexRef.current];
      if (wordExtras && wordExtras.length > 0) {
        wordExtras.pop();
        inputRef.current = inputRef.current.slice(0, -1);

        // Remove the extra charState entry that was appended
        // Find the insertion point: wordStart + currentWord.length + remaining extras offset
        const wordStart = getWordStartIndex(wordIndexRef.current);
        const removeAt = wordStart + currentWord.length + wordExtras.length;
        charStatesRef.current = [
          ...chars.slice(0, removeAt),
          ...chars.slice(removeAt + 1),
        ];
        charIndexRef.current = removeAt;
        incorrectCharsRef.current = Math.max(0, incorrectCharsRef.current - 1);
        return;
      }

      // Normal backspace within the current word
      if (inputRef.current.length > 0) {
        inputRef.current = inputRef.current.slice(0, -1);

        const posInWord = inputRef.current.length; // new length = position we are reverting
        const wordStart = getWordStartIndex(wordIndexRef.current);
        const ci = wordStart + posInWord;

        if (ci < chars.length) {
          // Revert the char state we're un-typing
          const prev = chars[ci];
          if (prev.state === 'correct') {
            correctCharsRef.current = Math.max(0, correctCharsRef.current - 1);
          } else if (prev.state === 'incorrect') {
            incorrectCharsRef.current = Math.max(0, incorrectCharsRef.current - 1);
          }
          chars[ci] = { ...chars[ci], state: 'pending' };
          charStatesRef.current = [...chars];
          charIndexRef.current = ci;
        }
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Space  --  advance to next word
    // -------------------------------------------------------------------------
    if (e.key === ' ') {
      e.preventDefault();

      // Only advance if at least one character has been typed for this word
      if (inputRef.current.length === 0) return;

      // Mark any remaining un-typed chars in this word as incorrect (skipped)
      const wordStart = getWordStartIndex(wordIndexRef.current);
      for (let i = inputRef.current.length; i < currentWord.length; i++) {
        const ci = wordStart + i;
        if (ci < chars.length && chars[ci].state === 'pending') {
          chars[ci] = { ...chars[ci], state: 'incorrect' };
          incorrectCharsRef.current += 1;
        }
      }

      // Mark the space separator as correct
      const spaceIndex = wordStart + currentWord.length + (extraCharsRef.current[wordIndexRef.current]?.length || 0);
      if (spaceIndex < chars.length && chars[spaceIndex].char === ' ') {
        chars[spaceIndex] = { ...chars[spaceIndex], state: 'correct' };
        correctCharsRef.current += 1;
      }

      totalKeystrokesRef.current += 1;
      keystrokeLogRef.current.push({ key: ' ', timestamp: now, delay, correct: true });

      charStatesRef.current = [...chars];
      wordIndexRef.current += 1;
      inputRef.current = '';
      charIndexRef.current = getWordStartIndex(wordIndexRef.current);

      // Check if all words completed (words mode)
      if (mode === 'words' && wordIndexRef.current >= modeValue) {
        finish();
      }
      // Also finish if we've run out of words in time mode
      if (wordIndexRef.current >= wordsArray.current.length) {
        finish();
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Regular character
    // -------------------------------------------------------------------------
    const posInWord = inputRef.current.length;

    if (posInWord < currentWord.length) {
      // Typing within the expected word
      const expectedChar = currentWord[posInWord];
      const isCorrect = e.key === expectedChar;

      const wordStart = getWordStartIndex(wordIndexRef.current);
      const ci = wordStart + posInWord;

      if (ci < chars.length) {
        chars[ci] = { ...chars[ci], state: isCorrect ? 'correct' : 'incorrect' };
        charStatesRef.current = [...chars];
      }

      if (isCorrect) {
        correctCharsRef.current += 1;
      } else {
        incorrectCharsRef.current += 1;
      }

      totalKeystrokesRef.current += 1;
      inputRef.current += e.key;
      charIndexRef.current = ci + 1;

      keystrokeLogRef.current.push({ key: e.key, timestamp: now, delay, correct: isCorrect });

      // In words mode, if this was the last char of the last word, auto-finish
      if (mode === 'words' && wordIndexRef.current === modeValue - 1 && inputRef.current.length === currentWord.length) {
        finish();
        return;
      }
      // Also auto-finish if we completed the very last word in the text
      if (wordIndexRef.current === wordsArray.current.length - 1 && inputRef.current.length === currentWord.length) {
        finish();
        return;
      }
    } else {
      // Extra character beyond the word length
      if (!extraCharsRef.current[wordIndexRef.current]) {
        extraCharsRef.current[wordIndexRef.current] = [];
      }
      extraCharsRef.current[wordIndexRef.current].push(e.key);
      inputRef.current += e.key;

      incorrectCharsRef.current += 1;
      totalKeystrokesRef.current += 1;

      // Insert an extra char state entry after the current word's chars
      const wordStart = getWordStartIndex(wordIndexRef.current);
      const insertAt = wordStart + currentWord.length + extraCharsRef.current[wordIndexRef.current].length - 1;
      const extraState = { char: e.key, state: 'extra' };
      charStatesRef.current = [
        ...chars.slice(0, insertAt),
        extraState,
        ...chars.slice(insertAt),
      ];

      keystrokeLogRef.current.push({ key: e.key, timestamp: now, delay, correct: false });
    }
  }, [startEngine, finish, mode, modeValue]);

  // ---------------------------------------------------------------------------
  // Reset: full re-init (new words expected to come from parent)
  // ---------------------------------------------------------------------------
  const reset = useCallback(() => {
    stopRAF();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    init();
  }, [init, stopRAF]);

  // ---------------------------------------------------------------------------
  // Restart: re-init with the same words
  // ---------------------------------------------------------------------------
  const restart = useCallback(() => {
    stopRAF();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    init();
  }, [init, stopRAF]);

  const pause = useCallback(() => {
    stopRAF();
    isActiveRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [stopRAF]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    ...displayState,
    handleKeyDown,
    reset,
    restart,
    pause,
  };
}
