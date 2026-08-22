# TalentHub Backend

Express + MongoDB + JWT API for the TalentHub AI-powered hiring platform.

## Setup

```bash
npm install
npm run seed               # optional: creates demo recruiter + applicant + jobs
npm run dev                 # starts on http://localhost:5000
```

Demo logins after seeding (all passwords `password123`):
- Recruiter: `karan@vertexsystems.demo`
- Applicant: `applicant@demo.com`

## Architecture

```
config/        DB connection
models/        Mongoose schemas (User, Job, Application, Bookmark)
middleware/    auth (protect/authorize/optionalAuth), validate, errorHandler
controllers/   business logic, one file per resource
routes/        route definitions + express-validator rules
services/      openrouter.js - LLM API wrapper (used by both AI features)
utils/         ApiError, ApiResponse, generateToken, seed.js
server.js      app bootstrap
```

All responses follow `{ success, message, data }`. All errors follow
`{ success: false, message, errors: [] }` via the central `errorHandler`.

## Auth

- `POST /api/auth/register/applicant` — name, email, password, skills?, experience?, bio?
- `POST /api/auth/register/recruiter` — name, email, password, companyName, website?, aboutCompany?
- `POST /api/auth/login` — email, password (common login for both roles)
- `GET  /api/auth/me` — current user (for persistent login on app load)

JWT is returned on register/login. Frontend should store it and send
`Authorization: Bearer <token>` on every subsequent request.

## Jobs

- `GET /api/jobs` — search/filter/sort/paginate. Query params:
  `search, location, employmentType, workMode, experience, salaryMin, salaryMax, sort, page, limit`
- `GET /api/jobs/featured` — landing page featured jobs
- `GET /api/jobs/:id` — full details + similar jobs + applicationStatus (if logged in as applicant)
- `GET /api/jobs/recruiter/mine` — recruiter's own jobs (`?status=active|archived`) — **recruiter**
- `POST /api/jobs` — create — **recruiter**
- `PUT /api/jobs/:id` — edit (owner only) — **recruiter**
- `PATCH /api/jobs/:id/archive` — toggle active/archived (owner only) — **recruiter**

## Applications

- `POST /api/applications/:jobId` — apply — **applicant**
- `PATCH /api/applications/:jobId/withdraw` — withdraw — **applicant**
- `GET /api/applications/mine` — applicant's own applications — **applicant**
- `GET /api/applications/job/:jobId` — applicants for a job (owner only) — **recruiter**
- `PATCH /api/applications/:id/status` — shortlist/reject (owner only) — **recruiter**

## Bookmarks

- `GET /api/bookmarks` · `POST /api/bookmarks/:jobId` · `DELETE /api/bookmarks/:jobId` — **applicant**

## Dashboard

- `GET /api/dashboard/recruiter` — active/archived job counts, total applications,
  total shortlisted, 5 most recent applications — **recruiter**

## Profile

- `PUT /api/profile` — update own profile (fields allowed differ by role)
- `GET /api/profile/recruiter/:id` — public recruiter/company info (used on job details page)

## AI (OpenRouter)

- `POST /api/ai/interview-prep/:jobId` — **applicant** — returns 5 questions, topics to
  revise, and prep tips for that specific job, generated from the job description.
- `POST /api/ai/hiring-assistant/:jobId` — **recruiter**, body `{ question }` — answers
  are grounded strictly in that job's applicant data (skills, experience, bio, education);
  the system prompt explicitly forbids inventing facts and instructs the model to say so
  when the data is insufficient.

Both AI routes are rate-limited (10 req/min/IP) since LLM calls are costlier than normal
CRUD, and return clear 503/504/429 error messages on outage, timeout, or rate limiting
(see `services/openrouter.js`) so the frontend can show meaningful error states.

## Bonus Feature: AI-Generated Cover Letter

- `POST /api/ai/cover-letter/:jobId` — **applicant** — drafts a tailored cover
  letter (150–220 words) from the applicant's own profile (name, bio, skills,
  experience) and the job's title/description/skills. Like the hiring
  assistant, the prompt is explicitly restricted to never invent specific
  past employers, projects, or achievements the applicant hasn't actually
  listed — sparse profiles get a general, enthusiasm-focused letter instead
  of fabricated specifics.
- The draft is fully editable before the applicant submits it — it populates
  the existing `Application.coverNote` field (which the apply endpoint
  already accepted but the frontend never previously exposed a way to fill).
- Same rate limiting and error handling as the other two AI routes.

## Uploads

- `POST /api/upload/resume` — multipart field `file` (PDF/DOC/DOCX, max 5MB) — **auth required**
- `POST /api/upload/photo` — multipart field `file` (JPG/PNG/WEBP/GIF, max 5MB) — **auth required**
- Both return `{ url }`. Storage backend auto-selects: Cloudinary if
  `CLOUDINARY_*` env vars are set, otherwise local disk (dev only — see the
  deployment note below).

## Fixes from code review (resubmission)

Every item below was verified against the actual code before fixing, not assumed:

| # | Issue | Fix |
|---|---|---|
| 1 | Expired jobs shown as available | `getJobs`/`getFeaturedJobs`/`getRecentJobs` now exclude `applicationDeadline < now`; Job Details shows an **Expired** badge and blocks applying (frontend) |
| 2 | Resume link not saved at registration | `registerApplicant` never destructured `resumeUrl` from the request body — fixed on both ends (frontend was also dropping it from the payload) |
| 3 | Archived jobs publicly accessible via direct URL | `getJobById` had no status check at all — now 404s for archived jobs unless the requester is the owning recruiter |
| 6 | Filters behaved like radio buttons | Was single-select dressed as checkboxes — rewritten as genuine multi-select (`$in` queries), not just switched to radio inputs |
| 7 | Mobile filter scroll | Filter panel is now collapsed by default on mobile behind a **Filters** toggle button |
| — | Search failed for partial phrases (e.g. "Frontend Engineering") | Replaced MongoDB `$text` (stemming/tokenization made partial-phrase matches unreliable) with word-level regex OR-matching across title/company/skills |
| — | Max salary filter reported broken | Reviewed the full pipeline (frontend → query params → `Number()` cast → `$lte`) and found it correctly implemented — couldn't reproduce a distinct bug. Best explanation: a symptom of the same `$text` fragility as the search bug, which is now eliminated as a side effect. Flagging this honestly rather than claiming a fix I couldn't verify without a live database. |
| — | Cover letter "not generating a response" | Verified end-to-end wiring is correct and structurally identical to the working Interview Prep feature. Extended the AI request timeout (25s → 45s) since free-tier OpenRouter models can genuinely exceed the old timeout under load — a premature client-side timeout doesn't cancel the request upstream, so retries can stack. Couldn't fully confirm this was the exact root cause without live infra access. |
| — | Edit Job: no loading/error state | Root cause: `updateJob` had no `pending`/`rejected` reducer cases at all — the Edit form's loading/error props were wired to state that nothing ever set during an update. Also separated create/update errors into their own `mutationError` field so they can no longer be clobbered by, or bleed in from, an unrelated fetch elsewhere in the app. |
| — | Apply button doesn't disable after applying | `applicationStatus` (which the button reads) lives in a different Redux slice than `applyToJob`/`withdrawApplication`, which never updated it — added cross-slice reducers so it updates instantly, matching the app's existing "no refresh needed" pattern |
| — | Resume/photo: URL-only | Real file upload added (multer + Cloudinary in production, local disk for dev) — see Uploads above |

**Remember Me / Forgot Password** (frontend, see that README): Remember Me now
actually switches between `localStorage` (persists) and `sessionStorage`
(cleared on browser close). Forgot Password was a dead link with no handler —
removed rather than half-implemented, since a real reset flow needs email
infrastructure out of scope for this pass.

### Deployment note: file uploads require Cloudinary in production

This backend's `vercel.json` deploys it as a Vercel serverless function.
Serverless filesystems are **read-only** outside `/tmp` — local-disk uploads
(the dev fallback in `middleware/upload.js`) will fail with `EROFS` once
deployed. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` (free tier at cloudinary.com) in your Vercel project's
environment variables — the code auto-detects and switches storage backends,
no further changes needed.

## Notes on design choices

- **Validation**: `Job.applicationDeadline` is validated as future-only both at the
  Mongoose schema level and again in `express-validator`, so it's enforced even if a
  document is created directly.
- **Ownership checks**: every mutate/read-sensitive recruiter route (edit job, archive,
  view applicants, shortlist/reject) verifies `resource.recruiter === req.user._id`.
- **No duplicate applications**: unique compound index on `{ job, applicant }`;
  re-applying after a withdrawal flips the same document back to `applied` instead of
  creating a duplicate row.
- **AI grounding**: the hiring assistant serializes only whitelisted applicant fields
  into the prompt and instructs the model to decline rather than fabricate when unsure.
