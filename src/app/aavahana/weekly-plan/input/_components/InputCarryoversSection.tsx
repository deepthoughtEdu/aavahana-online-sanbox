import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@/components/shared/icons';
import { cn } from '@/utils';
import { containerPadding, horizontalPadding, verticalPadding } from '@/utils/shared/design.utils';
import type { Backlog, LearningItem } from '@/types/aavahana/weekly-plan.types';

interface InputCarryoversSectionProps {
  expandedSection: string | null;
  toggleSection: (section: string) => void;
  backlogs: Backlog[];
  learningAgenda: LearningItem[];
  getCarryoversTeaser: () => string;
}

export function InputCarryoversSection({
  expandedSection,
  toggleSection,
  backlogs,
  learningAgenda,
  getCarryoversTeaser,
}: InputCarryoversSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={cn(
        "rounded-2xl transition-all duration-300",
        expandedSection === 'carryovers'
          ? "bg-white border border-base-300"
          : "hover:bg-white/50"
      )}
    >
      <motion.button
        onClick={() => toggleSection('carryovers')}
        className={cn("w-full flex items-center justify-between", containerPadding.lg)}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center"
            whileHover={{ rotate: -10 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-lg">{'\u21A9'}</span>
          </motion.div>
          <div className="text-left">
            <span className="font-medium text-black">Unfinished business</span>
            <p className="text-xs text-neutral mt-0.5">
              {getCarryoversTeaser()}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expandedSection === 'carryovers' ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRightIcon size="md" className="text-neutral" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'carryovers' && (
          <motion.div
            className={cn("overflow-hidden", horizontalPadding.lg, verticalPadding.lg)}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-neutral mb-3">
                  Carrying forward
                </p>
                <p className="text-xs text-neutral mb-3 italic">
                  Debt compounds. Resolve or release.
                </p>
                {backlogs.map((b, i) => (
                  <motion.div
                    key={b.id}
                    className={cn("rounded-xl bg-warning/5 border border-warning/10 mb-2", containerPadding.sm)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    <p className="text-sm text-black">{b.task}</p>
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-neutral mb-3">
                  Last week taught you
                </p>
                <p className="text-xs text-neutral mb-3 italic">
                  Wisdom is experience applied.
                </p>
                {learningAgenda.map((l, i) => (
                  <motion.div
                    key={l.id}
                    className={cn("rounded-xl bg-success/5 border border-success/10 mb-2", containerPadding.sm)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.15, duration: 0.3 }}
                  >
                    <p className="text-sm text-black">{l.title}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
