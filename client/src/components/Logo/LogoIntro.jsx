import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './logo.css';

const LETTERS = ['C', 'A', 'D', 'E', 'N', 'Z', 'A'];
const E_INDEX = 3;
const STORAGE_KEY = 'cadenza_visited';

export default function LogoIntro({ onDone }) {
  const [showTagline, setShowTagline] = useState(false);
  const isReturning = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, '1');

    const taglineDelay = isReturning ? 500 : 2600;
    const doneDelay = isReturning ? 1100 : 3800;

    const t1 = setTimeout(() => setShowTagline(true), taglineDelay);
    const t2 = setTimeout(() => onDone && onDone(), doneDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallDuration = isReturning ? 0.35 : 0.6;
  const baseDelay = isReturning ? 0.05 : 0.25;
  const stagger = isReturning ? 0.04 : 0.11;

  return (
    <div className="cad-intro" role="status" aria-label="CADENZA">
      <div className="cad-intro-word">
        {LETTERS.map((letter, i) => {
          const isE = i === E_INDEX;
          const delay = isE
            ? baseDelay + (LETTERS.length - 1) * stagger + 0.12
            : baseDelay + i * stagger;

          return (
            <motion.span
              key={i}
              className={isE ? 'cad-intro-letter cad-intro-e' : 'cad-intro-letter'}
              initial={{ y: -140, opacity: 0, rotate: 0 }}
              animate={{ y: isE ? 6 : 0, opacity: 1, rotate: isE ? -7 : 0 }}
              transition={{
                delay,
                duration: isE ? fallDuration + 0.15 : fallDuration,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              {letter}
            </motion.span>
          );
        })}
      </div>

      {showTagline && (
        <motion.p
          className="cad-intro-tagline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          One Room. One Rhythm.
        </motion.p>
      )}
    </div>
  );
}
