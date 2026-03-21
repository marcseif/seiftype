import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Simple countdown timer hook.
 *
 * Counts down from `initialSeconds` to 0 using setInterval (1 s tick).
 * Calls `onComplete` when the value reaches 0.
 */
export default function useCountdown(initialSeconds, onComplete) {
  const [value, setValue] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  const [prevInitial, setPrevInitial] = useState(initialSeconds);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Keep value in sync if initialSeconds changes while stopped
  if (!isRunning && initialSeconds !== prevInitial) {
    setPrevInitial(initialSeconds);
    setValue(initialSeconds);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    // Prevent double-start
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setValue((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          // Defer callback so React state is settled
          queueMicrotask(() => {
            if (onCompleteRef.current) onCompleteRef.current();
          });
          return 0;
        }
        return next;
      });
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    stop();
    setValue(initialSeconds);
  }, [initialSeconds, stop]);

  return { value, start, stop, reset, isRunning };
}
