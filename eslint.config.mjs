import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * "Today" is the reader's today, not UTC's.
 *
 * `new Date().toISOString().slice(0, 10)` is the UTC date. In India that is YESTERDAY between
 * midnight and 05:30, so a form pre-filled at 02:00 IST offers the wrong day, a filter starts a
 * day early, and the attendance calendar highlights the wrong cell. `date.utils.ts` has said
 * "NEVER use" this since it was written; a comment is not a rule, and eight places did it
 * anyway. `todayISO()` is the answer and already existed.
 *
 * Only `new Date()` with NO arguments is matched, i.e. "now". Two correct idioms look almost
 * identical and must NOT be caught: representing a local calendar date as UTC midnight
 * (`new Date(Date.UTC(...)).toISOString().slice(0, 10)`), and building a datetime-local value by
 * offsetting first. Both operate on a constructed date, not on bare `new Date()`.
 */
const UTC_TODAY_SELECTORS = [
  {
    selector:
      "CallExpression[callee.object.callee.object.type='NewExpression']" +
      "[callee.object.callee.object.callee.name='Date']" +
      "[callee.object.callee.object.arguments.length=0]" +
      "[callee.object.callee.property.name='toISOString']" +
      "[callee.property.name=/^(slice|substring|substr)$/]",
    message:
      "This is the UTC date, which is yesterday in India before 05:30. Use todayISO() from " +
      "@/utils/shared/date.utils, or formatDate(d, 'YYYY-MM-DD') for a specific day. For a " +
      "datetime-local input use nowForDateTimeLocal().",
  },
  {
    selector:
      "CallExpression[callee.object.callee.object.type='NewExpression']" +
      "[callee.object.callee.object.callee.name='Date']" +
      "[callee.object.callee.object.arguments.length=0]" +
      "[callee.object.callee.property.name='toISOString']" +
      "[callee.property.name='split']",
    message:
      "This is the UTC date, which is yesterday in India before 05:30. Use todayISO() from " +
      "@/utils/shared/date.utils.",
  },
];

/**
 * A time on screen must say whose clock it is.
 *
 * Tarun locked the rule on 2026-08-29: every rendered time carries its zone, derived from the
 * viewer's browser and never typed as a literal. `toLocaleTimeString` and `toLocaleString`
 * render a time with no zone unless someone remembers `timeZoneName`, and nobody remembers it
 * at a hundred call sites. So the methods are banned and one formatter always includes it.
 *
 * Deliberately shaped to MISS numbers: `total.toLocaleString()` for a rupee figure or a token
 * count is correct, and the first draft of this flagged 24 of those.
 */
const ZONE_LABEL_SELECTORS = [
  {
    selector:
      "CallExpression[callee.object.type='NewExpression'][callee.object.callee.name='Date']" +
      "[callee.property.name=/^toLocale(Time)?String$/]",
    message:
      "A rendered time must carry its zone. Use formatInstant/formatInstantShort/" +
      "formatInstantLong from @/utils/shared/date.utils, or the <Instant> component inside " +
      "anything that server-renders.",
  },
  {
    selector:
      "CallExpression[callee.object.name=/(At|Date|Time|Timestamp|timestamp)$/]" +
      "[callee.property.name=/^toLocale(Time)?String$/]",
    message:
      "A rendered time must carry its zone. Use formatInstant/formatInstantShort/" +
      "formatInstantLong from @/utils/shared/date.utils.",
  },
  {
    selector:
      "CallExpression[callee.object.property.name=/(At|Date|Time|Timestamp|timestamp)$/]" +
      "[callee.property.name=/^toLocale(Time)?String$/]",
    message:
      "A rendered time must carry its zone. Use formatInstant/formatInstantShort/" +
      "formatInstantLong from @/utils/shared/date.utils.",
  },
  {
    selector: "CallExpression[callee.property.name='toLocaleTimeString']",
    message:
      "A rendered time must carry its zone. Use formatInstantShort() from " +
      "@/utils/shared/date.utils.",
  },
];

/** Hardcoded hex in a className, banned per DT CSS-first architecture. */
const CSS_FIRST_SELECTORS = [
  {
    selector: "JSXAttribute[name.name='className'] Literal[value=/bg-\\[#|text-\\[#|border-\\[#/]",
    message: "Hardcoded hex in className violates DT CSS-first architecture. Use DT token classes (bg-base-200, dt-text-muted, etc.).",
  },
  {
    selector: "JSXAttribute[name.name='className'] TemplateLiteral > TemplateElement[value.raw=/bg-\\[#|text-\\[#|border-\\[#/]",
    message: "Hardcoded hex in className violates DT CSS-first architecture. Use DT token classes (bg-base-200, dt-text-muted, etc.).",
  },
];

/**
 * ⚠️ FLAT CONFIG REPLACES A RULE, IT DOES NOT MERGE IT. The last block whose `files` match a
 * file wins outright for that rule name, so a block that sets `no-restricted-syntax` for its own
 * purpose silently DELETES every other selector for those files. That is exactly what happened
 * on the first attempt at the UTC-today rule: the CRM block came later, so the new selectors
 * never applied to any CRM file and the rule looked like it was passing.
 *
 * Every block below therefore spreads in whatever else applies to its files.
 */

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "error",
      "react-hooks/exhaustive-deps": "error",
      "import/no-anonymous-default-export": "error",
      // Security-focused rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      // DT CSS-first architecture — ban deleted design.utils exports globally (no migration needed, they don't exist)
      "no-restricted-imports": ["error", {
        "paths": [
          {
            "name": "@/utils/shared/design.utils",
            // Deleted in Phase 1+2. bgColors/textColors/borderColors are banned per-module as Scale-up phases complete.
            "importNames": [
              "buttonSizes", "badgeSizes",
              "buttonColorClasses", "buttonVariantClasses", "buttonShapeClasses",
              "buttonModifierClasses", "tooltipPositionsClasses"
            ],
            "message": "Design value maps removed from design.utils. Use DaisyUI template literals (btn-${color}), DT token classes (bg-base-200, dt-text-muted), or data-color attributes. See PDGMSDocs/ToDo/dt-css-first-architecture-plan.md"
          }
        ]
      }],
      // Unused vars — auto-fixable via unused-imports plugin
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["error", {
        "vars": "all",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "argsIgnorePattern": "^_",
      }],
    },
  },

  // DT CSS-first: ban color maps from design.utils in migrated modules.
  // Expand `files` as scale-up phases complete.
  {
    files: [
      "src/components/aavahana/plan/daily/**",
      "src/components/shared/Badge.tsx",
      "src/components/shared/Button.tsx",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [{
          "name": "@/utils/shared/design.utils",
          "importNames": ["bgColors", "textColors", "borderColors"],
          "message": "Color maps not allowed in migrated modules. Use DT token classes (bg-base-200, dt-text-muted) or data-color attributes. See dt-css-first-architecture-plan.md"
        }]
      }],
    },
  },

  // DT CSS-first: ban hardcoded hex in className — enforced on migrated modules.
  // Expand `files` as scale-up phases complete (Scale-up A: all Aavahana, Scale-up B: all frontend).
  {
    files: [
      "src/components/aavahana/plan/daily/**",
      "src/components/shared/Badge.tsx",
      "src/components/shared/Button.tsx",
    ],
    rules: {
      // Spread, not replace: these files are also src/**, so dropping the today selectors here
      // would exempt them from that rule entirely.
      "no-restricted-syntax": ["error", ...CSS_FIRST_SELECTORS, ...UTC_TODAY_SELECTORS],
    },
  },

  // Service files use require() for lazy mock-data loading (intentional getMocks() pattern)
  // and `as any` casts for untyped JSON imports. Both are gated by isJsonMode() —
  // never run in production. Scoped tightly to services only.
  {
    files: [
      "src/lib/services/**/*.ts",
      "src/lib/services/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Every file, both rules. See the two const blocks above for what each catches and why.
  //
  // The zone-label half was scoped to the CRM while the rest of the app was migrated; that
  // scoping is gone as of 2026-09-01, when finance, admin, ATS, LDI, Samatva, activities,
  // support tickets and the whole virtual tour were converted. Nothing is exempt except the
  // five files listed below, each for a stated reason.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...UTC_TODAY_SELECTORS, ...ZONE_LABEL_SELECTORS] },
  },

  // The four exemptions, each for a different reason. None of them is "this was inconvenient".
  //
  //   date.utils / Instant     the formatter itself — the one place allowed to call the
  //                            methods it exists to replace
  //   use-weekly-report-ai     all-UTC and consistent within itself; half-converting it would
  //                            let it call an unfinished week finished. See its header.
  //   leave.utils              a leave bound is a calendar DAY resolved in the org's zone, not
  //                            an instant; documented in place
  //   rate-limiter / logger    developer diagnostics that go to console.log, never to a user.
  //                            A zone label on a debug line is noise, and nobody reading their
  //                            own console is in another country.
  //   instant.utils.test       calls the raw methods on purpose, to check the formatter
  //                            against them
  {
    files: [
      "src/utils/shared/date.utils.ts",
      "src/components/shared/Instant.tsx",
      "src/lib/hooks/aavahana/use-weekly-report-ai.ts",
      "src/utils/aavahana/leave.utils.ts",
      "src/lib/api/rate-limiter.ts",
      "src/lib/managers/logger.ts",
      "src/utils/shared/__tests__/*.test.ts",
    ],
    rules: { "no-restricted-syntax": "off" },
  },

  // Node.js utility scripts use CommonJS require() by design
  {
    files: ["scripts/**/*.js", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-local/**",  // second dev server's build dir (NEXT_DIST_DIR), generated, gitignored
      ".claude/**",        // Claude worktree artifacts — never lint these
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lovable.dev/**",
      "tmpclaude-*/**",    // Stale worktree dirs in root
      ".ds-sync/**",       // design-sync converter scripts + deps (generated, gitignored)
      "ds-bundle/**",      // design-sync build output (generated, gitignored)
      ".design-sync/**",   // design-sync inputs/cache (stubs + compiled CSS, generated)
    ],
  },
];

// ✅ export named variable instead of anonymous array
export default eslintConfig;
