# TalentHub Backend

Express + MongoDB + JWT API for the TalentHub AI-powered hiring platform.

## Setup

```bash
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY
npm install
npm run seed               # optional: creates demo recruiter + applicant + jobs
npm run dev                 # starts on http://localhost:5000
```

Demo logins after seeding (all passwords `password123`):
- Recruiter: `recruiter@demo.com` (Nimbus Tech — has the most seeded applicants)
- Applicant: `applicant@demo.com`
- 3 more recruiters and 7 more applicants are seeded too, for a fuller demo —
  see the console output after `npm run seed` for the full list, or check
  `utils/seed.js`. In total: 4 recruiters, 8 applicants, 24 jobs, and a mix
  of applications/bookmarks so the dashboard and applicants pages aren't empty.

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
