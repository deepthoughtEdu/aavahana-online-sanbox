# Mock data guide

The local API handler is `src/app/api/[...path]/route.ts`. It wraps payloads as `{ "response": ... }` because the production API client unwraps that field. The handler currently recognises:

| Request | Response |
| --- | --- |
| `GET /api/auth/session` | Fictional `user` with organisation `sandbox` and employee ID `1` |
| `GET /api/v3/pdgms/people/employees/me` | Fictional employee profile with no programs |
| `GET /api/v3/pdgms/crm/calling-targets/me` | Empty calling-program list for the landing page |
| `GET /api/config` | Local CSRF placeholder |

Every other path returns 501. To add a fixture, first read its service method in `src/lib/services/` and the response type in `src/types/`. Use that exact response shape, wrap it in `{ response: payload }`, and add at least one browser check for the page that consumes it. Use fictional names and values. Date-relative fixtures should derive their dates at request time so daily and weekly pages remain current.

For a mutation, update one local source of truth and derive any list or summary from it. A response that claims success without changing the next read is misleading in a sandbox.
