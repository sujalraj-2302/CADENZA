import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './reactions.css';

const EMOJIS = ['😂', '🔥', '❤️', '😭', '😱', '👏', '💀', '🤯'];

/**
 * Reaction bar (tap to send) + lightweight floating overlay. Reactions are
 * ephemeral - they animate up and vanish, nothing heavy is kept mounted.
 */
export function ReactionBar({ onReact }) {
  return (
    <div className="cad-reaction-bar">
      {EMOJIS.map((e) => (
        <button key={e} className="cad-reaction-btn cad-focus" onClick={() => onReact(e)}>
          {e}
        </button>
      ))}
    </div>
  );
}

export function ReactionOverlay({ incoming }) {
  const [floaters, setFloaters] = useState([]);

  const push = useCallback((emoji) => {
    const id = `${Date.now()}-${Math.random()}`;
    const left = 10 + Math.random() * 80; // spread horizontally
    setFloaters((f) => [...f, { id, emoji, left }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1800);
  }, []);

  useEffect(() => {
    if (incoming) push(incoming.emoji);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  return (
    <div className="cad-reaction-overlay" aria-hidden="true">
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            className="cad-reaction-floater"
            style={{ left: `${f.left}%` }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -140, opacity: [0, 1, 1, 0], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.7, ease: 'easeOut' }}
          >
            {f.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
