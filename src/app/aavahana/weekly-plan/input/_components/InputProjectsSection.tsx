import { motion, AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { ChevronRightIcon } from '@/components/shared/icons';
import { cn } from '@/utils';
import { containerPadding, gaps, horizontalPadding, verticalPadding } from '@/utils/shared/design.utils';
import type { ProjectCharter } from '@/types/aavahana/weekly-plan.types';

interface InputProjectsSectionProps {
  expandedSection: string | null;
  toggleSection: (section: string) => void;
  activeProjects: ProjectCharter[];
  selectedProjects: string[];
  toggleProject: (id: string) => void;
  getProjectsTeaser: () => string;
}

export function InputProjectsSection({
  expandedSection,
  toggleSection,
  activeProjects,
  selectedProjects,
  toggleProject,
  getProjectsTeaser,
}: InputProjectsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className={cn(
        "rounded-2xl transition-all duration-300",
        expandedSection === 'projects'
          ? "bg-white border border-base-300"
          : "hover:bg-white/50"
      )}
    >
      <motion.button
        onClick={() => toggleSection('projects')}
        className={cn("w-full flex items-center justify-between", containerPadding.lg)}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Target className="w-5 h-5 text-primary" />
          </motion.div>
          <div className="text-left">
            <span className="font-medium text-black">What are you building?</span>
            <p className="text-xs text-neutral mt-0.5">
              {getProjectsTeaser()}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expandedSection === 'projects' ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRightIcon size="md" className="text-neutral" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'projects' && (
          <motion.div
            className={cn("overflow-hidden", horizontalPadding.lg, verticalPadding.lg)}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="text-xs text-neutral mb-4 italic">
              &ldquo;Focus is saying no to a hundred good ideas.&rdquo; — Steve Jobs
            </p>
            <div className={cn("flex flex-col", gaps.sm)}>
              {activeProjects.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  onClick={() => toggleProject(p.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full rounded-xl text-left transition-all duration-200",
                    containerPadding.md,
                    selectedProjects.includes(p.id)
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-base-300/50 opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                        selectedProjects.includes(p.id) ? "border-primary bg-primary" : "border-black/40"
                      )}
                      animate={{ scale: selectedProjects.includes(p.id) ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {selectedProjects.includes(p.id) && <span className="text-primary-content text-xs">{'\u2713'}</span>}
                    </motion.div>
                    <div>
                      <p className="font-medium text-sm text-black">{p.name}</p>
                      <p className="text-xs text-neutral mt-1">{p.objective}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
