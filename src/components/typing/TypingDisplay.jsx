/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Caret from './Caret';

/**
 * TypingDisplay -- main typing area that renders a text passage character by
 * character, colours each span according to its typing state, and positions an
 * animated caret at the current input index.
 *
 * Props
 * -----
 * charStates   : Array<{ char: string, state: 'correct'|'incorrect'|'pending'|'extra' }>
 * charIndex    : number -- current flat character position
 * caretStyle   : 'line' | 'block' | 'underline' | 'pulse'
 * smoothCaret  : boolean
 * font         : CSS font-family string
 * fontSize     : number (px)
 */
export default function TypingDisplay({
  charStates = [],
  charIndex = 0,
  caretStyle = 'line',
  smoothCaret = true,
  font = "'JetBrains Mono', monospace",
  fontSize = 18,
}) {
  const containerRef = useRef(null);
  const charRefs = useRef([]);

  // Caret position as React state so Caret re-renders on every move
  const [caretState, setCaretState] = useState({
    left: 0,
    top: 0,
    height: fontSize * 1.6,    width: fontSize * 0.6,  });

  // ---------------------------------------------------------------------------
  // Build word groups for rendering.  Each group contains sequential characters
  // up to and including a space (the space is the word's trailing delimiter).
  // The last word will have no trailing space.
  // ---------------------------------------------------------------------------
  const wordGroups = useMemo(() => {
    const groups = [];
    let currentWord = [];
    let globalIndex = 0;

    for (let i = 0; i < charStates.length; i++) {
      const cs = charStates[i];
      currentWord.push({ ...cs, index: globalIndex });
      globalIndex++;

      if (cs.char === ' ') {
        groups.push(currentWord);
        currentWord = [];
      }
    }
    if (currentWord.length > 0) {
      groups.push(currentWord);
    }
    return groups;
  }, [charStates]);

  // ---------------------------------------------------------------------------
  // Recalculate caret position whenever charIndex or charStates change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = charRefs.current[charIndex];
    const container = containerRef.current;
    if (!container) return;

    let newPos;

    if (el) {
      const containerRect = container.getBoundingClientRect();
      const charRect = el.getBoundingClientRect();

      newPos = {
        left: charRect.left - containerRect.left + container.scrollLeft,
        top: charRect.top - containerRect.top + container.scrollTop,
        height: charRect.height,
        width: charRect.width,
      };
    } else if (charIndex > 0 && charRefs.current[charIndex - 1]) {
      // Past the end -- place caret right after the last character
      const lastEl = charRefs.current[charIndex - 1];
      const containerRect = container.getBoundingClientRect();
      const charRect = lastEl.getBoundingClientRect();

      newPos = {
        left: charRect.right - containerRect.left + container.scrollLeft,
        top: charRect.top - containerRect.top + container.scrollTop,
        height: charRect.height,
        width: charRect.width,
      };
    }

    if (newPos) {
      setCaretState(newPos);
    }
  }, [charIndex, charStates]);

  // ---------------------------------------------------------------------------
  // Auto-scroll: keep the current line visible inside the container
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = charRefs.current[charIndex];
    const container = containerRef.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const charRect = el.getBoundingClientRect();
    const lineHeight = charRect.height;

    // Current character below visible area
    if (charRect.bottom > containerRect.bottom - lineHeight) {
      container.scrollTop += charRect.top - containerRect.top - lineHeight;
    }
    // Current character above visible area
    if (charRect.top < containerRect.top + lineHeight) {
      container.scrollTop -= containerRect.top - charRect.top + lineHeight;
    }
  }, [charIndex]);

  // ---------------------------------------------------------------------------
  // Character style resolver
  // ---------------------------------------------------------------------------
  const getCharStyle = useCallback((state) => {
    switch (state) {
      case 'correct':
        return { color: 'var(--color-correct)' };
      case 'incorrect':
        return {
          color: 'var(--color-incorrect)',
          backgroundColor: 'var(--color-error-bg)',
          borderBottom: '2px solid var(--color-incorrect)',
        };
      case 'extra':
        return {
          color: 'var(--color-incorrect)',
          fontStyle: 'italic',
        };
      case 'pending':
      default:
        return { color: 'var(--color-untyped)' };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden leading-relaxed select-none"
      style={{
        fontFamily: font,
        fontSize: `${fontSize}px`,
        lineHeight: 1.8,
        maxHeight: `${fontSize * 1.8 * 4}px`, // ~4 visible lines
        minHeight: `${fontSize * 1.8 * 2}px`,
        outline: 'none',
      }}
      tabIndex={-1}
    >
      {/* Caret */}
      <Caret
        position={caretState}
        style={caretStyle}
        smooth={smoothCaret}
        charWidth={caretState.width}
      />

      {/* Word groups */}
      <div className="flex flex-wrap">
        {wordGroups.map((group, gi) => (
          <span key={gi} className="inline-block whitespace-pre">
            {group.map((cs) => {
              const justMistyped =
                cs.state === 'incorrect' && cs.index === charIndex - 1;
              return (
                <span
                  key={cs.index}
                  ref={(el) => {
                    charRefs.current[cs.index] = el;
                  }}
                  className={[
                    'inline-block transition-colors duration-75',
                    justMistyped ? 'animate-[shake_0.3s_ease-in-out]' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={getCharStyle(cs.state)}
                >
                  {cs.char === ' ' ? '\u00A0' : cs.char}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
