import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './room-common.css';

export default function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        className="cad-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cad-modal cad-card"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cad-modal-header">
            <h2>{title}</h2>
            <button className="cad-focus" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
