'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/shared/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Section } from '@/components/shared/Section';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@/components/shared/icons';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { HighPriorityEventNudge } from '@/components/shared/HighPriorityEventNudge';
import { cn } from '@/utils';
import { containerPadding, gaps, horizontalPadding } from '@/utils/shared/design.utils';
import { getIsoWeekEnd, formatDate } from '@/utils/shared/date.utils';
import { formatDateRange } from '../_components/weekly-plan.helpers';
import { useWeeklyPlanInput } from './_components/useWeeklyPlanInput';
import { InputProjectsSection } from './_components/InputProjectsSection';
import { InputCarryoversSection } from './_components/InputCarryoversSection';
import { InputUploadSection } from './_components/InputUploadSection';

export default function WeeklyPlanInputPage() {
  const {
    textPrompt,
    setTextPrompt,
    isRecording,
    isSupported,
    toggleRecording,
    expandedSection,
    toggleSection,
    activeProjects,
    selectedProjects,
    toggleProject,
    backlogs,
    learningAgenda,
    currentWeek,
    selectedWeekStart,
    isCurrentWeek,
    isNextDisabled,
    navigateWeek,
    isUploading,
    fileInputRef,
    handleFileChange,
    handleDrop,
    loading,
    aiSuggestions,
    handleGeneratePlan,
    insight,
    hoursLeft,
    getProjectsTeaser,
    getCarryoversTeaser,
  } = useWeeklyPlanInput();

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title={isCurrentWeek ? 'Plan Your Week' : 'Past Week'}
        subtitle={formatDateRange(selectedWeekStart, getIsoWeekEnd(selectedWeekStart))}
      >
        <div className={cn('flex items-center', gaps.sm)}>
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => navigateWeek('prev')}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: 'Previous week', position: 'bottom' }}
          />
          <Button
            color="secondary"
            variant="soft"
            size="sm"
            className="pointer-events-none"
          >
            {isCurrentWeek ? 'This Week' : formatDate(selectedWeekStart, 'MMM DD')}
          </Button>
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => navigateWeek('next')}
            disabled={isNextDisabled}
            iconBefore={<ChevronRightIcon size="sm" />}
            tooltip={{ text: 'Next week', position: 'bottom' }}
          />
        </div>
      </PageHeader>

      <div className={cn("w-full", "space-y-6")}>
        <Section>
          <Section.Body>
            {/* Hero - inviting and aspirational */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="relative rounded-2xl overflow-hidden mb-6"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src="/week-planning-hero.jpg"
              alt="Week planning"
              className="w-full h-48 object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-white/90 via-white/40 to-transparent" />
            <motion.div
              className="absolute bottom-4 left-5 right-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-xs text-neutral tracking-wide uppercase mb-1">
                Week {currentWeek.weekNumber}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                What will you create?
              </h1>
            </motion.div>
          </motion.div>

          <motion.p
            className={cn("text-neutral text-sm leading-relaxed", horizontalPadding.xs)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {insight}
          </motion.p>

          {/* Time awareness - makes it real */}
          <motion.div
            className={cn("mt-4 flex items-center gap-2 text-sm", horizontalPadding.xs)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ClockIcon size="sm" className="text-neutral" />
            </motion.div>
            <span className="text-neutral">{hoursLeft} hours · precious and finite</span>
          </motion.div>
        </motion.div>

        {/* Sections - each with purpose */}
        <div className={cn("flex flex-col", gaps.md)}>
          <InputProjectsSection
            expandedSection={expandedSection}
            toggleSection={toggleSection}
            activeProjects={activeProjects}
            selectedProjects={selectedProjects}
            toggleProject={toggleProject}
            getProjectsTeaser={getProjectsTeaser}
          />

          <InputCarryoversSection
            expandedSection={expandedSection}
            toggleSection={toggleSection}
            backlogs={backlogs}
            learningAgenda={learningAgenda}
            getCarryoversTeaser={getCarryoversTeaser}
          />

          <InputUploadSection
            expandedSection={expandedSection}
            toggleSection={toggleSection}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleDrop={handleDrop}
          />
        </div>

        {/* The core input - where intention becomes plan */}
        <motion.div
          className={cn("mt-10 rounded-2xl bg-white border border-base-300", containerPadding.xl)}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="font-medium text-black mb-1">What matters most this week?</p>
          <p className="text-xs text-neutral mb-5">
            Be honest. Be specific. Your plan is only as good as your input.
          </p>

          <div className="relative">
            <textarea
              placeholder="This week, I need to..."
              className="w-full min-h-[100px] resize-none text-sm bg-white border border-base-300 rounded-lg px-4 py-3 pr-14 focus:outline-none focus:border-primary transition-colors"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
            />
            <VoiceButton
              isRecording={isRecording}
              isSupported={isSupported}
              onClick={() => toggleRecording(textPrompt)}
            />
          </div>

          {aiSuggestions.length > 0 && (
            <div className="mt-4 rounded-lg border border-base-300 bg-base-200/70 px-4 py-3">
              <p className="text-xs font-medium text-neutral mb-2">AI suggestions</p>
              <ul className="text-xs text-neutral space-y-1">
                {aiSuggestions.slice(0, 3).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          )}

          <HighPriorityEventNudge
            compact
            sourceScreen="/aavahana/weekly-plan/input"
            headline="While you're planning — what non-negotiables need a protected slot?"
            subtext="L&D session, strategic review, 1:1 with your mentor? Add them now before the week fills."
            className="mb-6"
          />

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              color="primary"
              size="lg"
              modifier="block"
              className="mt-4 rounded-xl"
              loading={loading}
              onClick={handleGeneratePlan}
              iconAfter={
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRightIcon size="sm" />
                </motion.div>
              }
            >
              Generate plan
            </Button>
          </motion.div>

          <p className="text-xs text-center text-neutral mt-4">
            AI will structure your intentions into actionable outcomes
          </p>
        </motion.div>
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
