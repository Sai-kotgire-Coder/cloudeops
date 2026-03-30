import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useLearningStore } from '@/store/learningStore';
import { LEARNING_CONTENT } from '@/data/learningContent';

export const LearningSidebar = () => {
  const { sidebarOpen, activeTopic, viewedTopics, closeSidebar, beginnerMode, toggleBeginnerMode } = useLearningStore();

  const activeContent = activeTopic ? LEARNING_CONTENT[activeTopic] : null;
  const progress = Math.round((viewedTopics.length / Object.keys(LEARNING_CONTENT).length) * 100);

  return (
    <AnimatePresence>
      {sidebarOpen && activeContent && (
        <>
          {/* Dim Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40 pointer-events-auto cursor-pointer"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] sm:max-w-[90vw] bg-card/95 backdrop-blur-xl border-l border-border z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 shrink-0 bg-background/50">
              <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>DevOps Academy</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
                  <span className="font-mono">{viewedTopics.length}/{Object.keys(LEARNING_CONTENT).length}</span>
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 sm:pb-6">
              
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {activeContent.title}
                </h2>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={toggleBeginnerMode}
                     className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors min-h-[36px] ${beginnerMode ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}
                   >
                     {beginnerMode ? 'Beginner Mode ON' : 'Beginner Mode OFF'}
                   </button>
                </div>
              </div>

              {/* Beginner Explanation */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-inner">
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">
                    {activeContent.beginner}
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  How It Works
                </h3>
                <ul className="space-y-2.5 ml-1 select-none">
                  {activeContent.how_it_works.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground/80 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why It Matters */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-warning" />
                  Why It Matters
                </h3>
                <div className="pl-4 border-l-2 border-warning/50">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {activeContent.why_it_matters}
                  </p>
                </div>
              </div>

              {/* Game Context */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  In This Simulator
                </h3>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-100/90 leading-relaxed">
                  {activeContent.simulator_context}
                </div>
              </div>

              {/* Pro Tip */}
              {beginnerMode && (
                <div className="p-4 rounded-xl bg-[#111827] border border-green-500/20 mt-8">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                    <Zap className="w-4 h-4" /> Pro Tip
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{activeContent.pro_tip}"
                  </p>
                </div>
              )}

              <div className="pt-8 pb-4">
                <button
                  onClick={closeSidebar}
                  className="w-full py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Close Learning Panel
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
