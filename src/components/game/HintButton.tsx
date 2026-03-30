import { HelpCircle, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useLearningStore, TopicId } from '@/store/learningStore';

interface HintButtonProps {
  hint: string;
  className?: string;
  topicId?: TopicId;
}

export const HintButton = ({ hint, className = '', topicId }: HintButtonProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const { openTopic } = useLearningStore();

  const calcPosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tipW = 260;
    let left = rect.left + rect.width / 2 - tipW / 2;
    // keep inside viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    const top = rect.top - 8; // will be offset by transform
    setPos({ top, left });
  };

  useEffect(() => {
    if (open) calcPosition();
  }, [open]);

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); calcPosition(); setOpen(!open); }}
        className="p-2 rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Show hint"
      >
        <HelpCircle className="w-4 h-4 text-primary/50 hover:text-primary active:text-primary transition-colors" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: pos.top,
                  left: pos.left,
                  width: 260,
                  transform: 'translateY(-100%)',
                  zIndex: 9999,
                }}
                className="p-3 rounded-xl bg-card border border-border shadow-2xl text-xs text-foreground leading-relaxed overflow-hidden"
              >
                {/* Arrow */}
                <div
                  className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-45 z-0"
                />
                <div className="relative z-10">{hint}</div>
                {topicId && (
                  <div className="relative z-10 mt-2.5 pt-2.5 border-t border-border/50 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); openTopic(topicId); setOpen(false); }}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 active:text-primary/60 transition-colors min-h-[36px] px-2"
                    >
                      Learn More <ExternalLink className="w-3 h-3 mb-[1px]" />
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
