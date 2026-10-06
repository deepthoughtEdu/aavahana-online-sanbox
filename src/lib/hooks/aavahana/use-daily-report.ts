// lib/hooks/use-daily-report.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import { ReportService, PlanService } from "@/lib/services";
import {
  SubmitReportResponse,
  ReportPlanItem,
  Framework,
} from "@/types/aavahana/report.types";
import { toast } from "@/utils";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { startOf, addTime, formatDate } from "@/utils/shared/date.utils";
import { logger } from "@/lib/managers/logger";

export function useDailyReport(initialDate?: string) {
  // Date helpers
  const getTodayISO = () => startOf(new Date(), "day", "format", "YYYY-MM-DD");
  const getNextDayISO = (date: string) =>
    formatDate(addTime(date, 1, "day"), "YYYY-MM-DD");
  const getPrevDayISO = (date: string) =>
    formatDate(addTime(date, -1, "day"), "YYYY-MM-DD");

  // State
  const [currentDate, setCurrentDate] = useState(initialDate || getTodayISO());
  const [reflection, setReflection] = useState("");
  const [activeFrameworks, setActiveFrameworks] = useState<string[]>([]);
  const [submissionAttempt, setSubmissionAttempt] = useState(0);
  const [submitResponse, setSubmitResponse] =
    useState<SubmitReportResponse | null>(null);
  const [frameworkDescriptions, setFrameworkDescriptions] = useState<
    Record<string, string>
  >({});

  const todayISO = getTodayISO();
  const isToday = currentDate === todayISO;

  // ✅ Fetch report data - useApi handles ApiResult automatically
  const {
    data: reportData,
    isLoading: isLoadingToday,
    refetch: refetchReport,
  } = useApi({
    queryFn: () => ReportService.getReportForDate(currentDate),
    queryKey: ["report", currentDate],
  });


  // ✅ Fetch logout status - useApi handles ApiResult automatically
  const {
    data: logoutStatus,
    isLoading: isLoadingStatus,
    refetch: refetchLogoutStatus,
  } = useApi({
    queryFn: () => PlanService.checkLoginStatus(currentDate),
    queryKey: ["logout-status", currentDate],
  });

  // Derive logout status boolean from API data
  const backendLogoutAt = logoutStatus?.logoutAt;
  const hasLoggedOut = useMemo(
    () => Boolean(backendLogoutAt),
    [backendLogoutAt]
  );

  // ✅ FIXED: Use useMemo for derived data
  const evaluationData = useMemo(() => {
    const source = submitResponse?.evaluated || reportData?.evaluated;
    return {
      submissionStatus: source?.submissionStatus ?? null,
      nudgeInfo: source?.nudgeInfo,
    };
  }, [submitResponse, reportData]);

  const { submissionStatus, nudgeInfo } = evaluationData;

  const isReportSubmitted = useMemo(
    () => submissionStatus === "submitted",
    [submissionStatus]
  );
  const needsNudge = useMemo(
    () => submissionStatus === "needs_nudge",
    [submissionStatus]
  );
  const nudgeMessages = useMemo(
    () => nudgeInfo?.nudgeMessages || [],
    [nudgeInfo]
  );

  const planTasks: ReportPlanItem[] = useMemo(
    () => reportData?.plan || [],
    [reportData]
  );

  // ✅ FIX: Changed from 'framework' to 'frameworks' (plural)
  const frameworks: Framework[] = useMemo(
    () => reportData?.frameworks || [],
    [reportData]
  );

  // Helper to clear submission-specific state only
  const clearNavigationState = useCallback(() => {
    setSubmitResponse(null);
  }, []);

  // ✅ Submit logout mutation - useApiMutation handles ApiResult automatically
  const logoutMutation = useApiMutation({
    mutationFn: ReportService.postLogout,
    onSuccess: () => {
      toast.success("Logout successful!");
      setReflection("");
      refetchLogoutStatus();
    },
    onError: (error) => {
      logger.error("Logout error", error);
      toast.error(error.message || "Logout failed");
    },
  });

  const submitLogout = useCallback(async () => {
    logoutMutation.mutate(undefined);
  }, [logoutMutation]);

  // ✅ Submit report mutation - useApiMutation handles ApiResult automatically
  const submitReportMutation = useApiMutation({
    mutationFn: ReportService.submitReport,
    onSuccess: (data) => {
      setSubmitResponse(data);
      if (data?.evaluated?.submissionStatus === "needs_nudge") {
        toast.error("Please add more details to your reflection");
        setSubmissionAttempt((prev) => prev + 1);
        refetchReport();
      } else {
        toast.success("Report submitted successfully!");
        setSubmitResponse(null);
        refetchReport();
        setReflection("");
      }
    },
    onError: (error) => {
      logger.error("Submit error", error);
      toast.error(error.message || "Failed to submit report");
      setSubmitResponse(null);
    },
  });

  const submitReport = useCallback(
    async (planUpdates: Array<{ index: number; status: string }>) => {
      if (!reflection.trim()) {
        toast.error("Please write your reflection first");
        return { success: false, needsNudge: false };
      }

      submitReportMutation.mutate({
        report: reflection,
        date: currentDate,
        planUpdates,
      });

      // Return value based on pending state
      return submitReportMutation.isPending
        ? { success: false, needsNudge: false }
        : { success: true, needsNudge: false };
    },
    [reflection, currentDate, submitReportMutation]
  );

  // ✅ Submit framework mutation - FIXED: Added refetch after success
  // ✅ Submit framework mutation - FIXED: Added refetch after success
  const submitFrameworkMutation = useApiMutation({
    mutationFn: ReportService.submitFrameworks,
    onSuccess: async (_, variables) => {
      const frameworkText = variables.frameworks[0].text;
      const frameworkDescription = variables.frameworks[0].description || ""; // ✅ Ensure it's never undefined

      // ✅ Optimistically update local state immediately
      setActiveFrameworks((prev) => {
        // Avoid duplicates
        if (prev.includes(frameworkText)) {
          return prev;
        }
        return [...prev, frameworkText];
      });

      // ✅ FIX: Ensure description is always a string, not undefined
      setFrameworkDescriptions((prev) => ({
        ...prev,
        [frameworkText]: frameworkDescription, // Now guaranteed to be string
      }));

      toast.success(`Saved notes for "${frameworkText}"`);

      // ✅ FIX: Refetch to get the latest data from backend
      await refetchReport();
    },
    onError: (error) => {
      logger.error("Framework error", error);
      toast.error(error.message || "Failed to save framework");
    },
  });

  const submitFramework = useCallback(
    async (text: string, description: string) => {
      submitFrameworkMutation.mutate({
        date: currentDate,
        frameworks: [{ text, description }],
      });
    },
    [currentDate, submitFrameworkMutation]
  );

  // ✅ Update reflection mutation - useApiMutation handles ApiResult automatically
  const updateReflectionMutation = useApiMutation({
    mutationFn: ReportService.updateReflection,
    onSuccess: () => {
      toast.success("Reflection updated successfully");
      refetchReport();
    },
    onError: (error) => {
      logger.error("Update error", error);
      toast.error(error.message || "Failed to update reflection");
    },
  });

  const updateReflection = useCallback(
    async (key: string, value: string) => {
      updateReflectionMutation.mutate({
        date: currentDate,
        dailyReflection: { [key]: value },
      });
    },
    [currentDate, updateReflectionMutation]
  );

  // Load reflection from API data when it changes
  useEffect(() => {
    setReflection(reportData?.report || "");
  }, [reportData]);

  // ✅ FIX: Transform backend response properly
  // Load active frameworks & descriptions from API data
  useEffect(() => {
    // ✅ Changed from reportData?.framework to reportData?.frameworks
    if (
      Array.isArray(reportData?.frameworks) &&
      reportData.frameworks.length > 0
    ) {
      const frameworkNames = reportData.frameworks.map((fw) => fw.text);
      const descriptions: Record<string, string> = {};

      reportData.frameworks.forEach((fw) => {
        descriptions[fw.text] = fw.description || "";
      });

      setActiveFrameworks(frameworkNames);
      setFrameworkDescriptions(descriptions);
    } else {
      setActiveFrameworks([]);
      setFrameworkDescriptions({});
    }
  }, [reportData]);

  // Navigation handlers
  const goToPrevDay = useCallback(() => {
    setCurrentDate(getPrevDayISO(currentDate));
    clearNavigationState();
  }, [currentDate, clearNavigationState]);

  const goToNextDay = useCallback(() => {
    const nextISO = getNextDayISO(currentDate);
    if (nextISO <= todayISO) {
      setCurrentDate(nextISO);
      clearNavigationState();
    }
  }, [currentDate, todayISO, clearNavigationState]);

  const jumpToDate = useCallback(
    (date: string) => {
      if (date <= todayISO) {
        setCurrentDate(date);
        clearNavigationState();
      } else {
        toast.error("Cannot jump to future date");
      }
    },
    [todayISO, clearNavigationState]
  );

  const isLoading = isLoadingToday || isLoadingStatus;

  return {
    // State & data
    currentDate,
    isToday,
    reflection,
    activeFrameworks,
    isLoading,
    isSubmitting: submitReportMutation.isPending,
    isSubmittingFrameworks: submitFrameworkMutation.isPending,
    isUpdatingReflection: updateReflectionMutation.isPending,
    isReportSubmitted,
    needsNudge,
    isLoggingOut: logoutMutation.isPending,
    submissionAttempt,

    // Logout info
    hasLoggedOut,
    backendLogoutAt,

    nudgeMessages,
    frameworkDescriptions,

    reportData,
    planTasks,
    frameworks,

    // Actions
    setReflection,
    submitReport,
    submitLogout,
    submitFramework,
    updateReflection,
    goToPrevDay,
    goToNextDay,
    jumpToDate,
    refetchReport,
  };
}
