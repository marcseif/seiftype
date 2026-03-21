import { useEffect, useState } from 'react';

const IDLE_THRESHOLD = 500; // ms before blink starts

/**
 * Animated caret component for the typing display.
 *
 * Renders an absolutely positioned indicator at the given coordinates.
 * Supports line, block, underline, and pulse visual styles.
 * Blinks after the typist is idle for 500ms and transitions smoothly
 * when `smooth` is enabled.
 */
export default function Caret({ position, style = 'line', smooth = true, charWidth = 10 }) {
  const [idle, setIdle] = useState(false);
  const [prevPosition, setPrevPosition] = useState(position);

  if (prevPosition.left !== position.left || prevPosition.top !== position.top) {
    setPrevPosition(position);
    setIdle(false);
  }

  // Track position changes to detect idle state
  useEffect(() => {
    const timer = setTimeout(() => setIdle(true), IDLE_THRESHOLD);
    return () => clearTimeout(timer);
  }, [position.left, position.top]);

  const height = position.height || '1.2em';
  const transition = smooth ? 'transform 100ms cubic-bezier(0.2, 0, 0, 1)' : 'none';

  let targetX = position.left ?? 0;
  let targetY = position.top ?? 0;

  // Build variant-specific styles and animation class
  let variantStyle = {};
  let animationClass = '';

  switch (style) {
    case 'block':
      variantStyle = {
        width: charWidth,
        backgroundColor: 'var(--color-caret)',
        opacity: 0.6,
        borderRadius: '2px',
      };
      animationClass = idle ? 'caret-block' : '';
      break;

    case 'underline':
      variantStyle = {
        width: charWidth,
        height: '2px',
        backgroundColor: 'var(--color-caret)',
        borderRadius: '1px',
      };
      // Recalculate top to sit at the bottom of the character
      targetY = targetY + (position.height ?? 24) - 2;
      animationClass = idle ? 'caret-underline' : '';
      break;

    case 'pulse':
      variantStyle = {
        width: '2px',
        backgroundColor: 'var(--color-caret)',
        borderRadius: '1px',
      };
      animationClass = idle ? 'caret-pulse' : '';
      break;

    case 'line':
    default:
      variantStyle = {
        width: '2px',
        backgroundColor: 'var(--color-caret)',
        borderRadius: '1px',
      };
      animationClass = idle ? 'caret-line' : '';
      break;
  }

  // Base styles shared by all caret variants
  const baseStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${targetX}px, ${targetY}px)`,
    height,
    transition,
    willChange: 'transform',
    pointerEvents: 'none',
    zIndex: 10,
  };

  // When the typist is active (not idle) we suppress the blink/pulse
  // CSS animations defined in index.css and just show a solid caret.
  const activeOverride = !idle
    ? { animation: 'none', opacity: style === 'block' ? 0.6 : 1 }
    : {};

  return (
    <div
      className={animationClass}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...activeOverride,
      }}
      aria-hidden="true"
    />
  );
}
