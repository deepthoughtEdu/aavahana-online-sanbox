import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, UploadIcon } from '@/components/shared/icons';
import { cn } from '@/utils';
import { containerPadding, horizontalPadding, verticalPadding } from '@/utils/shared/design.utils';

interface InputUploadSectionProps {
  expandedSection: string | null;
  toggleSection: (section: string) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;
}

export function InputUploadSection({
  expandedSection,
  toggleSection,
  isUploading,
  fileInputRef,
  handleFileChange,
  handleDrop,
}: InputUploadSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className={cn(
        "rounded-2xl transition-all duration-300",
        expandedSection === 'upload'
          ? "bg-white border border-base-300"
          : "hover:bg-white/50"
      )}
    >
      <motion.button
        onClick={() => toggleSection('upload')}
        className={cn("w-full flex items-center justify-between", containerPadding.lg)}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-xl bg-base-300 flex items-center justify-center"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <UploadIcon size="md" className="text-neutral" />
          </motion.div>
          <div className="text-left">
            <span className="font-medium text-black">Add context</span>
            <p className="text-xs text-neutral mt-0.5">
              Documents, notes, references
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expandedSection === 'upload' ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRightIcon size="md" className="text-neutral" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'upload' && (
          <motion.div
            className={cn("overflow-hidden", horizontalPadding.lg, verticalPadding.lg)}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              className={cn(
                "border-2 border-dashed border-base-300 rounded-xl text-center hover:border-primary/30 transition-colors cursor-pointer",
                containerPadding["2xl"]
              )}
              whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary) / 0.5)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <UploadIcon size="lg" className="mx-auto text-neutral mb-2" />
              <p className="text-sm text-neutral">
                {isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
