// src/components/aavahana/dashboard/dashboard.constants.ts

export const SPRINT_DAY_MINS = 480; // 8 hours

export const CAPACITY_THRESHOLDS = {
  LIGHT: 60,      // < 60%  → light day
  OPTIMAL_MAX: 90, // 60–90% → on track
  HEAVY_MAX: 110, // 90–110% → full day
  // > 110% → overloaded
} as const;

export const DRILL_PURPOSE: Record<string, string> = {
  daily_plan_submit:    "feeds your report",
  daily_report_submit:  "captures learning",
  weekly_plan_submit:   "structures your week",
  weekly_report_submit: "reviews time patterns",
  threadbuilding:       "practices your narrative",
  sd_pitch:             "sharpens delivery",
  ldi_pitch:            "builds leadership voice",
};
