# POPO GitHub development checkpoint — 2026-11-06

This is a **source-code backup checkpoint**, not a public release or full QA sign-off.

## Local development stages included

- Stage 5B: Kakao OAuth UI, authenticated account and guest navigation.
- Stage 5B.1–5B.2: birthplace options and readable Pretendard UI (Sabrina logo preserved).
- Stage 5C.1–5C.4: per-user birth-profile save/read/edit/delete; time picker; My Page and vault flow.
- Stage 5D.1: saved profile → local chart candidate preview, four pillars, elementary five-element count and expandable descriptions; local click/dialog fixes.

## What was checked by the user (as of Nov 6)

- Kakao login → My Page succeeded.
- Profile creation, editing, deletion, and list refresh behavior were reported functional.
- Read result dialog eventually opened and a solar test profile displayed four-pillars candidate and five-element chart.
- Visual adjustments to hero, compact profile cards and fonts were reviewed.

## Not yet production-ready

- Verified Korean calendrical birth chart computation for nationwide/lunar cases, unknown time and seasonal boundaries.
- Daeun/Seun verified data, complete interpretations, other animals' illustrations and compatibility feature.
- Two-account RLS isolation and full mobile/browser regression QA.
- Real GitHub Pages production release testing and privacy/terms/public API readiness.
- The chart currently uses a **candidate_only** local calculation, not a verified personal chart.

## Credential and publication boundaries

- `prototype/popo-supabase-config.js` intentionally remains **untracked locally** and is **excluded from this commit**.
- This checkpoint is pushed to `checkpoints/2026-11-06-stage5b-5d`, **not** `main`.
- GitHub Pages/production publishing requires a separate explicit release audit, including configuration decisions.
- No API keys, client secrets, authentication tokens or real user birth data should be included in this checkpoint.
