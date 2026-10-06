import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { useApi } from '@/lib/hooks/shared/use-api';
import { useSpeechRecognition } from '@/lib/hooks/shared/use-speech-recognition';
import { isError } from '@/lib/api/client';
import { stashWeeklyPlanGenerate } from '@/lib/store/shared/weekly-plan-generate';
import { getIsoWeekStart, formatDate, addTime, todayISO } from '@/utils/shared/date.utils';
import type { ProjectCharter, Backlog, LearningItem, WeekInfo } from '@/types/aavahana/weekly-plan.types';

// Wisdom that reframes the mundane
const insights = [
  "A week has 168 hours. Where you put them is who you become.",
  "The gap between your plan and reality is where growth lives.",
  "What you don't do defines you as much as what you do.",
  "Clarity today prevents chaos tomorrow.",
  "Every 'yes' is a 'no' to something else.",
];

export interface WeeklyPlanInputState {
  // Router
  router: ReturnType<typeof useRouter>;

  // Text / voice
  textPrompt: string;
  setTextPrompt: (v: string) => void;
  isRecording: boolean;
  isSupported: boolean;
  toggleRecording: (currentText: string) => void;

  // Section expansion
  expandedSection: string | null;
  toggleSection: (section: string) => void;

  // Projects
  activeProjects: ProjectCharter[];
  selectedProjects: string[];
  toggleProject: (id: string) => void;

  // Carry-overs
  backlogs: Backlog[];
  learningAgenda: LearningItem[];

  // Week info
  currentWeek: WeekInfo;
  selectedWeekStart: string;
  isCurrentWeek: boolean;
  isNextDisabled: boolean;
  navigateWeek: (direction: 'prev' | 'next') => void;

  // Upload
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;

  // Generate
  loading: boolean;
  aiSuggestions: string[];
  handleGeneratePlan: () => Promise<void>;

  // Computed
  insight: string;
  hoursLeft: number;
  getProjectsTeaser: () => string;
  getCarryoversTeaser: () => string;
}

export function useWeeklyPlanInput(): WeeklyPlanInputState {
  const router = useRouter();
  const [textPrompt, setTextPrompt] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [insight] = useState(() => insights[Math.floor(Math.random() * insights.length)]);
  const [loading, setLoading] = useState(false);
  // Suggestions now render on the Weekly Plan screen (not inline here).
  const aiSuggestions: string[] = [];
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  const defaultWeek: WeekInfo = {
    startDate: todayISO(),
    endDate: todayISO(),
    weekNumber: 0,
  };

  // Week navigation (local override)
  const currentMondayISO = getIsoWeekStart(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(currentMondayISO);
  const isCurrentWeek = selectedWeekStart === currentMondayISO;
  const isNextDisabled = selectedWeekStart >= currentMondayISO;

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addTime(selectedWeekStart, direction === 'prev' ? -7 : 7, 'day');
    setSelectedWeekStart(formatDate(newWeekStart, 'YYYY-MM-DD'));
  };

  const { data: activeProjects = [] } = useApi({
    queryKey: ["weekly-plan-input-projects"],
    queryFn: () => WeeklyPlanService.getActiveProjects(),
  });

  const { data: backlogs = [] } = useApi({
    queryKey: ["weekly-plan-input-backlogs"],
    queryFn: () => WeeklyPlanService.getBacklogs(),
  });

  const { data: learningAgenda = [] } = useApi({
    queryKey: ["weekly-plan-input-learning"],
    queryFn: () => WeeklyPlanService.getLearningAgenda(),
  });

  const { data: currentWeek = defaultWeek } = useApi({
    queryKey: ["weekly-plan-input-week"],
    queryFn: () => WeeklyPlanService.getCurrentWeek(),
  });

  // Auto-select all projects on first load
  useEffect(() => {
    if (activeProjects.length > 0 && selectedProjects.length === 0) {
      setSelectedProjects(activeProjects.map((p: ProjectCharter) => p.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjects]);

  // Speech transcript sync
  useEffect(() => {
    if (transcript) {
      setTextPrompt(transcript);
    }
  }, [transcript]);

  // --- File handlers ---

  const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64 || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      if (!base64) return;

      const result = await WeeklyPlanService.uploadNote({
        fileName: file.name,
        fileData: base64,
        relatedEntities: { projects: selectedProjects },
        processWithAI: true,
      });

      if (!isError(result)) {
        // Uploaded note is available via weekly cadence notes endpoint
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileSelected(file);
    }
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelected(file);
    }
  };

  // --- Generate plan ---
  // Hand the intent to the Weekly Plan screen, which runs the AI generation
  // (showing a "creating your plan" state) and lets the user edit + save.

  const handleGeneratePlan = async () => {
    setLoading(true);
    stashWeeklyPlanGenerate({ intent: textPrompt, weekStart: selectedWeekStart });
    resetTranscript();
    router.push('/aavahana/weekly-plan');
  };

  // --- Toggle helpers ---

  const toggleProject = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // --- Computed values ---

  const now = new Date();
  const endOfWeek = new Date(currentWeek.endDate);
  const hoursLeft = Math.max(0, Math.round((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const getProjectsTeaser = () => {
    const count = selectedProjects.length;
    if (count === 0) return 'Nothing selected yet';
    return `${count} mission${count !== 1 ? 's' : ''} to advance`;
  };

  const getCarryoversTeaser = () => {
    const blocked = backlogs.filter((b: Backlog) => b.status === 'blocked').length;
    if (blocked > 0) return `${blocked} blocked item${blocked > 1 ? 's' : ''} from last week`;
    if (backlogs.length > 0) return `${backlogs.length} thing${backlogs.length > 1 ? 's' : ''} carried forward`;
    return 'Clean slate \u2713';
  };

  return {
    router,
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
  };
}
