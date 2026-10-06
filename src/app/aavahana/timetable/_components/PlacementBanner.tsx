'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '@/components/shared/icons';
import { Button } from '@/components/shared/Button';
import type { TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

const PIECE_SIZES = [1, 2, 3, 4, 5, 6];

interface PlacementBannerProps {
  deliverable: TimetableDeliverable;
  pieceHours: number;
  onPieceHoursChange: (h: number) => void;
  onCancel: () => void;
}

export function PlacementBanner({
  deliverable: _deliverable,
  pieceHours,
  onPieceHoursChange,
  onCancel,
}: PlacementBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="placement"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mt-4 rounded-xl border-2 border-[var(--dt-tealBorder)] bg-[var(--dt-tealDim)]"
      >
        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-lg select-none">📌</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary">
              Click any highlighted slot on the grid to place this block
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <CloseIcon size="sm" />
          </Button>
        </div>
        {/* Block size row */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          <span className="text-xs font-medium text-primary mr-1">
            Block size:
          </span>
          {PIECE_SIZES.map((h) => (
            <button
              key={h}
              onClick={() => onPieceHoursChange(h)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                pieceHours === h
                  ? 'bg-primary text-white border-[var(--dt-tealBorder)] shadow-sm'
                  : 'bg-base-100 text-primary border-[var(--dt-tealBorder)] hover:border-[var(--dt-tealBorder)]'
              }`}
            >
              {`${h}h`}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
