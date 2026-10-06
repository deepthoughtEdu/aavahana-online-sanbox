# Aavahana frontend sandbox

This repository contains the Aavahana routes and their local import dependencies extracted from `DT-CultureTech/PDGMS-Frontend` at commit `0e2a61142096aff34c67f0da7d2558a33290fa3b` (`origin/main`, 1 October 2026). Production files retain their original `src/` paths so changes can be compared back to the main frontend. The extraction includes all Aavahana page routes, components, hooks, services, types, shared imports, styles and static assets reachable from those files.

## Run locally

Use Node.js 20 or later.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000/aavahana`. The root URL redirects there. The sandbox uses a fictional local user and does not require a production login.

## Current scope

The production UI source and routes are present. `src/app/api/[...path]/route.ts` supplies a local session, employee record, empty calling-program list and a daily-plan flow. You can add tasks, submit today's plan, and read it back during the same server session. Other production API requests return HTTP 501 until a matching fixture is added. Screens that depend on those endpoints can show an error or empty state. This repository is therefore a source extraction with one working flow, not a complete behavioural copy of production.

No production database or credentials are included. The API mock must stay local, and fixture data must be fictional. See [CONTEXT.md](CONTEXT.md) and [MOCK-DATA-GUIDE.md](MOCK-DATA-GUIDE.md) before adding data.

## Source map

- `src/app/aavahana/`: Aavahana pages and route components
- `src/components/aavahana/`: Aavahana UI
- `src/lib/hooks/aavahana/`: data hooks
- `src/lib/services/aavahana/`: production service contracts
- `src/types/aavahana/`: module types
- `src/app/api/[...path]/route.ts`: sandbox API responses
- `src/components/sandbox/SandboxShell.tsx`: local navigation shell

The GitHub repository is named `aavahana-online-sanbox` as supplied. That spelling is retained in the remote URL.

The sandbox's daily-plan submit URL adds a `date` query parameter in `src/lib/services/aavahana/plan.service.ts`. The production service method signature is unchanged; the local mock needs the viewer's date to associate a submitted plan with its next read. Remove that query parameter when merging changes back to production.
