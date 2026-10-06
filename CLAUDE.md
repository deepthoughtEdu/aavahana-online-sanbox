# Aavahana sandbox coding guide

This repository uses Next.js 16, React 19, TypeScript, Tailwind CSS v4 and DaisyUI v5. It contains a source extraction of Aavahana from the production frontend. Preserve route paths, component props, hook interfaces and service signatures when making a change intended for upstream use.

## Work pattern

Read the target page, hook, service and type before editing. Add fictional data through `src/app/api/[...path]/route.ts`; the production UI calls that local route. A new endpoint should return the same response shape as its service type, inside `{ response: value }`. Return an explicit error for behaviour that has not been simulated. Do not connect this sandbox to production services or use real people or company records as fixtures.

Tailwind v4 uses `@import "tailwindcss"`; DaisyUI v5 uses `@plugin "daisyui"`. Do not add Tailwind v3 directives or a `tailwind.config.js`. Prefer the existing design tokens and classes over hardcoded colours or inline visual styles.

Use the exact enum values in the relevant `src/types/` file. Enum values commonly use `snake_case`; do not substitute invented camelCase values. Use short, concrete UI labels and keep empty states consistent with nearby production components.

Run `npm run type-check`, lint changed files, and build before sharing a change. The current sandbox's non-session API coverage is incomplete; the README states the limitation.
