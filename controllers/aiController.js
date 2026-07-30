const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");
const Application = require("../models/Application");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { callOpenRouter } = require("../services/openrouter");

// @desc    Generate interview prep material for a given job
// @route   POST /api/ai/interview-prep/:jobId
// @access  Private (applicant)
const generateInterviewPrep = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const systemPrompt = `You are an expert technical interview coach. Given a job description, produce interview
preparation material. Respond ONLY in the following exact structure, with no extra commentary before or after:

Interview Questions

1. <question>
2. <question>
3. <question>
4. <question>
5. <question>

Topics to Revise

- <topic>
- <topic>
- <topic>

Preparation Tips

<one short paragraph of practical advice>`;

  const userPrompt = `Job Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.skills.join(", ") || "Not specified"}
Experience Level: ${job.experience}
Job Description:
${job.description}

Generate the interview preparation material for an applicant preparing for this specific role.`;

  const content = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  res.status(200).json(new ApiResponse(200, { jobId: job._id, jobTitle: job.title, content }));
});

// @desc    Ask the AI hiring assistant a question about applicants for a job
// @route   POST /api/ai/hiring-assistant/:jobId
// @access  Private (recruiter, job owner only)
const askHiringAssistant = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) throw new ApiError(400, "A question is required");

  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.recruiter.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only query applicants for your own jobs");
  }

  const applications = await Application.find({ job: job._id, status: { $ne: "withdrawn" } })
    .populate("applicant", "name skills experience bio education");

  if (applications.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { answer: "There are no applicants for this job yet, so I have no data to analyze." }));
  }

  // Serialize only the fields the assistant is allowed to reason about
  const applicantData = applications.map((app, i) => ({
    ref: `Applicant ${i + 1}`,
    name: app.applicant.name,
    status: app.status,
    experience: app.applicant.experience || "Not specified",
    skills: app.applicant.skills?.length ? app.applicant.skills : ["Not specified"],
    bio: app.applicant.bio || "Not provided",
    education: (app.applicant.education || []).map((e) => `${e.degree} - ${e.institution} (${e.year})`),
  }));

  const systemPrompt = `You are a hiring assistant helping a recruiter evaluate applicants for a single job posting.
STRICT RULES:
- Only use the applicant data provided below. Never invent names, skills, experience, or facts not present in the data.
- If the data is insufficient to answer confidently, say so explicitly instead of guessing.
- Refer to applicants by their given "ref" label (e.g. "Applicant 2") alongside their name when relevant.
- Be concise and structured (use short bullet points where useful).`;

  const userPrompt = `Job: ${job.title} at ${job.company}
Required skills: ${job.skills.join(", ") || "Not specified"}

Applicant data (JSON):
${JSON.stringify(applicantData, null, 2)}

Recruiter question: ${question}`;

  const answer = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 600 }
  );

  res.status(200).json(new ApiResponse(200, { answer }));
});

// ---------------------------------------------------------------------------
// BONUS FEATURE: AI-Generated Cover Letter (applicant)
// Drafts a tailored cover letter from the applicant's own profile data and the
// job's description, which the applicant can edit before submitting it with
// their application (Application.coverNote). Never invents specifics — the
// prompt is explicitly restricted to the applicant's stored profile fields.
// ---------------------------------------------------------------------------

// @desc    Generate an AI cover letter draft for a given job
// @route   POST /api/ai/cover-letter/:jobId
// @access  Private (applicant)
const generateCoverLetter = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).populate("recruiter", "companyName");
  if (!job) throw new ApiError(404, "Job not found");

  const applicant = req.user;

  const systemPrompt = `You are a career coach ghostwriting a short cover letter in the applicant's own voice.
STRICT RULES:
- Only use the applicant details provided below (name, bio, skills, experience). Never invent specific past
  employers, companies, projects, metrics, or achievements that are not present in that data.
- If the applicant's bio or skills are sparse, keep the letter general and enthusiasm-focused rather than
  fabricating specifics to fill space.
- Write 150-220 words, first person, professional but warm tone. No placeholder brackets like [Company Name].
- Output ONLY the letter body text - no subject line, no "Dear Hiring Manager" header block, no signature block,
  no commentary before or after.`;

  const userPrompt = `Job Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.skills.join(", ") || "Not specified"}
Job Description:
${job.description}

Applicant Name: ${applicant.name}
Applicant Bio: ${applicant.bio || "Not provided"}
Applicant Skills: ${applicant.skills?.length ? applicant.skills.join(", ") : "Not specified"}
Applicant Experience: ${applicant.experience || "Not specified"}

Write the cover letter for this applicant applying to this specific role.`;

  const content = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 400 }
  );

  res.status(200).json(new ApiResponse(200, { jobId: job._id, content }));
});

module.exports = { generateInterviewPrep, askHiringAssistant, generateCoverLetter };
