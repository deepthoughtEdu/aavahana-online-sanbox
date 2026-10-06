# Mock data guide

The local API handler is `src/app/api/[...path]/route.ts`. It wraps payloads as `{ "response": ... }` because the production API client unwraps that field. The handler currently recognises:

| Request | Response |
| --- | --- |
| `GET /api/auth/session` | Fictional `user` with organisation `sandbox` and employee ID `1` |
| `GET /api/v3/pdgms/people/employees/me` | Fictional employee profile with no programs |
| `GET /api/v3/pdgms/crm/calling-targets/me` | Empty calling-program list for the landing page |
| `GET /api/v3/pdgms/loops/daily-plan/:date` | Submitted tasks for that date, or an empty plan |
| `POST /api/v3/pdgms/loops/daily-plan/submit?date=:date` | Stores the posted plan in memory and returns a success message |
| `GET /api/v3/pdgms/grammar/employees/me/basket/daily/:date` | Empty daily basket |
| `GET /api/v3/pdgms/loops/daily-plan/incomplete` | Empty yesterday carryover list |
| `GET /api/v3/pdgms/loops/daily-report/v7/draft` | No submitted report |
| `GET /api/v3/pdgms/loops/daily-report/v7/streak` | Zero growth streak |
| `GET /api/config` | Local CSRF placeholder |

Every other path returns 501. To add a fixture, first read its service method in `src/lib/services/` and the response type in `src/types/`. Use that exact response shape, wrap it in `{ response: payload }`, and add at least one browser check for the page that consumes it. Use fictional names and values. Date-relative fixtures should derive their dates at request time so daily and weekly pages remain current. Daily plans are held in server memory and reset when the server restarts.

For a mutation, update one local source of truth and derive any list or summary from it. A response that claims success without changing the next read is misleading in a sandbox.
