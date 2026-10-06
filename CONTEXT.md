# Aavahana context

Aavahana is the fellow-facing workspace in PDGMS. Its pages cover daily, weekly and monthly plans and reports, event-loop work, experiments, career progress, ideas, learning, attendance and related views.

The frontend normally reads and writes through shared PDGMS backend services. In this sandbox, those requests resolve to the local Next.js API route. The local session identifies a fictional fellow in a fictional organisation. The session, employee profile, empty calling-program list and daily-plan flow have fixture responses. Other API calls deliberately return 501 so missing behaviour is visible.

To keep a change easy to merge upstream, preserve production service signatures and route paths. Add fixture responses at the API boundary, then verify the relevant page and interaction in a browser. Keep business logic in the copied production code unless the sandbox explicitly documents a deviation.
