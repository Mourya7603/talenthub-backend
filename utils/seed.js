// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Bookmark = require("../models/Bookmark");

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const seed = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Bookmark.deleteMany({}),
  ]);

  // ---------------------------------------------------------------------
  // Recruiters (4 companies)
  // ---------------------------------------------------------------------
  const recruiterData = [
    {
      name: "Priya Sharma",
      email: "recruiter@demo.com",
      companyName: "Nimbus Tech",
      website: "https://nimbustech.example.com",
      aboutCompany: "Nimbus Tech builds cloud-native developer tools used by teams worldwide.",
    },
    {
      name: "Karan Mehta",
      email: "karan@vertexsystems.demo",
      companyName: "Vertex Systems",
      website: "https://vertexsystems.example.com",
      aboutCompany: "Vertex Systems is a fintech infrastructure company processing millions of transactions daily.",
    },
    {
      name: "Ananya Iyer",
      email: "ananya@bluepeaklabs.demo",
      companyName: "BluePeak Labs",
      website: "https://bluepeaklabs.example.com",
      aboutCompany: "BluePeak Labs designs consumer mobile apps with a focus on accessibility and speed.",
    },
    {
      name: "Rohit Verma",
      email: "rohit@solsticeanalytics.demo",
      companyName: "Solstice Analytics",
      website: "https://solsticeanalytics.example.com",
      aboutCompany: "Solstice Analytics builds data platforms and ML tooling for retail forecasting.",
    },
  ];

  const recruiters = await User.create(
    recruiterData.map((r) => ({ ...r, password: "password123", role: "recruiter" }))
  );

  // ---------------------------------------------------------------------
  // Applicants (8, diverse skill sets)
  // ---------------------------------------------------------------------
  const applicantData = [
    {
      name: "Arjun Rao",
      email: "applicant@demo.com",
      skills: ["React", "Redux Toolkit", "Node.js", "MongoDB"],
      experience: "2 years",
      bio: "Frontend-leaning full-stack developer who loves building clean UIs.",
      resumeUrl: "https://example.com/resume/arjun-rao.pdf",
      education: [{ degree: "B.Tech, Computer Science", institution: "VIT Vellore", year: "2023" }],
    },
    {
      name: "Sneha Kulkarni",
      email: "sneha@demo.com",
      skills: ["Node.js", "Express", "PostgreSQL", "Docker"],
      experience: "4 years",
      bio: "Backend engineer focused on scalable APIs and database performance.",
      resumeUrl: "https://example.com/resume/sneha-kulkarni.pdf",
      education: [{ degree: "B.E, Information Technology", institution: "Pune University", year: "2020" }],
    },
    {
      name: "Vikram Nair",
      email: "vikram@demo.com",
      skills: ["React", "TypeScript", "Next.js", "GraphQL"],
      experience: "5+ years",
      bio: "Senior frontend engineer, ex-startup, likes mentoring junior devs.",
      resumeUrl: "https://example.com/resume/vikram-nair.pdf",
      education: [{ degree: "M.S, Computer Science", institution: "IIIT Bangalore", year: "2019" }],
    },
    {
      name: "Fatima Sheikh",
      email: "fatima@demo.com",
      skills: ["Python", "Django", "AWS", "Kubernetes"],
      experience: "3-5",
      bio: "Full-stack developer with a DevOps streak — I like owning things end to end.",
      resumeUrl: "https://example.com/resume/fatima-sheikh.pdf",
      education: [{ degree: "B.Tech, Computer Science", institution: "Jamia Millia Islamia", year: "2021" }],
    },
    {
      name: "Aditya Deshmukh",
      email: "aditya@demo.com",
      skills: ["Java", "Spring Boot", "Microservices", "Kafka"],
      experience: "5+ years",
      bio: "Backend architect, previously built payment systems at scale.",
      resumeUrl: "https://example.com/resume/aditya-deshmukh.pdf",
      education: [{ degree: "B.E, Computer Engineering", institution: "COEP Pune", year: "2018" }],
    },
    {
      name: "Meera Pillai",
      email: "meera@demo.com",
      skills: ["React Native", "Swift", "Kotlin", "Firebase"],
      experience: "1-3",
      bio: "Mobile developer who shipped three apps to the App Store solo.",
      resumeUrl: "https://example.com/resume/meera-pillai.pdf",
      education: [{ degree: "B.Sc, Computer Science", institution: "Christ University", year: "2022" }],
    },
    {
      name: "Rahul Bansal",
      email: "rahul@demo.com",
      skills: ["Python", "Pandas", "SQL", "Tableau"],
      experience: "0-1",
      bio: "Recent grad, data analytics focus, comfortable with SQL and Python.",
      resumeUrl: "https://example.com/resume/rahul-bansal.pdf",
      education: [{ degree: "B.Tech, Data Science", institution: "MIT Manipal", year: "2024" }],
    },
    {
      name: "Divya Menon",
      email: "divya@demo.com",
      skills: ["Selenium", "Cypress", "Jest", "CI/CD"],
      experience: "3-5",
      bio: "QA engineer specializing in automated testing pipelines.",
      resumeUrl: "https://example.com/resume/divya-menon.pdf",
      education: [{ degree: "B.E, Computer Science", institution: "Anna University", year: "2020" }],
    },
  ];

  const applicants = await User.create(
    applicantData.map((a) => ({ ...a, password: "password123", role: "applicant" }))
  );

  // ---------------------------------------------------------------------
  // Jobs (6 per recruiter = 24 total), staggered post dates and deadlines
  // ---------------------------------------------------------------------
  const jobTemplates = [
    // Nimbus Tech (recruiters[0])
    { title: "Frontend Engineer", skills: ["React", "Redux Toolkit", "TypeScript"], salary: 1200000, experience: "1-3", location: "Bengaluru", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 2 },
    { title: "Backend Engineer", skills: ["Node.js", "Express", "MongoDB"], salary: 1400000, experience: "3-5", location: "Remote", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 5 },
    { title: "DevOps Engineer", skills: ["Docker", "Kubernetes", "AWS"], salary: 1600000, experience: "3-5", location: "Bengaluru", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 9 },
    { title: "QA Automation Engineer", skills: ["Cypress", "Jest", "CI/CD"], salary: 950000, experience: "1-3", location: "Bengaluru", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 14 },
    { title: "Engineering Intern", skills: ["JavaScript", "Git"], salary: 300000, experience: "0-1", location: "Bengaluru", employmentType: "Internship", workMode: "On-site", postedDaysAgo: 1 },
    { title: "Staff Frontend Engineer", skills: ["React", "Next.js", "GraphQL"], salary: 2400000, experience: "5+", location: "Remote", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 20 },

    // Vertex Systems (recruiters[1])
    { title: "Backend Engineer (Payments)", skills: ["Java", "Spring Boot", "Kafka"], salary: 1800000, experience: "3-5", location: "Mumbai", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 3 },
    { title: "Site Reliability Engineer", skills: ["Kubernetes", "AWS", "Docker"], salary: 2000000, experience: "5+", location: "Mumbai", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 7 },
    { title: "Frontend Developer", skills: ["React", "TypeScript"], salary: 1100000, experience: "1-3", location: "Mumbai", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 11 },
    { title: "Security Engineer", skills: ["Node.js", "AWS", "Security"], salary: 1900000, experience: "3-5", location: "Remote", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 16 },
    { title: "Contract Backend Developer", skills: ["Node.js", "PostgreSQL"], salary: 1500000, experience: "3-5", location: "Mumbai", employmentType: "Contract", workMode: "Hybrid", postedDaysAgo: 4 },
    { title: "Engineering Manager", skills: ["Java", "Microservices", "Leadership"], salary: 3200000, experience: "5+", location: "Mumbai", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 25 },

    // BluePeak Labs (recruiters[2])
    { title: "React Native Developer", skills: ["React Native", "Firebase"], salary: 1300000, experience: "1-3", location: "Hyderabad", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 2 },
    { title: "iOS Developer", skills: ["Swift", "Firebase"], salary: 1500000, experience: "3-5", location: "Hyderabad", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 6 },
    { title: "Android Developer", skills: ["Kotlin", "Firebase"], salary: 1450000, experience: "3-5", location: "Hyderabad", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 10 },
    { title: "Product Designer", skills: ["Figma", "UI/UX", "Prototyping"], salary: 1350000, experience: "1-3", location: "Remote", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 13 },
    { title: "Mobile QA Engineer", skills: ["Selenium", "Appium"], salary: 900000, experience: "0-1", location: "Hyderabad", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 18 },
    { title: "Part-time UI Developer", skills: ["React", "CSS", "Figma"], salary: 700000, experience: "0-1", location: "Remote", employmentType: "Part-time", workMode: "Remote", postedDaysAgo: 1 },

    // Solstice Analytics (recruiters[3])
    { title: "Data Analyst", skills: ["Python", "SQL", "Tableau"], salary: 1000000, experience: "0-1", location: "Pune", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 3 },
    { title: "Data Engineer", skills: ["Python", "AWS", "SQL"], salary: 1700000, experience: "3-5", location: "Pune", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 8 },
    { title: "ML Engineer", skills: ["Python", "TensorFlow", "AWS"], salary: 2100000, experience: "3-5", location: "Pune", employmentType: "Full-time", workMode: "Hybrid", postedDaysAgo: 12 },
    { title: "BI Developer", skills: ["SQL", "Tableau", "Power BI"], salary: 1150000, experience: "1-3", location: "Pune", employmentType: "Full-time", workMode: "On-site", postedDaysAgo: 15 },
    { title: "Data Science Intern", skills: ["Python", "Pandas"], salary: 350000, experience: "0-1", location: "Pune", employmentType: "Internship", workMode: "On-site", postedDaysAgo: 5 },
    { title: "Principal Data Engineer", skills: ["Python", "Kafka", "AWS"], salary: 2800000, experience: "5+", location: "Remote", employmentType: "Full-time", workMode: "Remote", postedDaysAgo: 22 },
  ];

  const jobsPayload = jobTemplates.map((t, i) => {
    const recruiter = recruiters[Math.floor(i / 6)];
    return {
      recruiter: recruiter._id,
      title: t.title,
      company: recruiterData[Math.floor(i / 6)].companyName,
      description: `We're looking for a ${t.title} to join our team. You'll work closely with product and engineering to ship reliable, well-tested features, and help shape how we build going forward. Strong communication and ownership matter as much as raw technical skill here.`,
      skills: t.skills,
      salary: t.salary,
      experience: t.experience,
      location: t.location,
      employmentType: t.employmentType,
      workMode: t.workMode,
      applicationDeadline: daysFromNow(45 - t.postedDaysAgo),
      createdAt: daysAgo(t.postedDaysAgo),
    };
  });

  const jobs = await Job.create(jobsPayload);
  console.log(`Created ${jobs.length} jobs across ${recruiters.length} recruiters.`);

  // ---------------------------------------------------------------------
  // Deliberately expire a few jobs so the "Expired" UI is actually
  // testable. Job.create() (above) correctly enforces "deadline must be in
  // the future" — same as a real recruiter creating a job — so it can't be
  // used to seed an already-past deadline. Job.updateOne() does NOT run
  // Mongoose validators by default (runValidators defaults to false), which
  // is exactly what's needed here: this is test-seeding infrastructure
  // deliberately creating a past-deadline state, not real user input that
  // should be validated.
  // ---------------------------------------------------------------------
  const jobsToExpire = jobs.slice(0, 3); // first 3 jobs (Nimbus Tech's) become expired
  await Promise.all(
    jobsToExpire.map((job) =>
      Job.updateOne({ _id: job._id }, { $set: { applicationDeadline: daysAgo(2) } })
    )
  );
  console.log(`Backdated ${jobsToExpire.length} jobs to an expired deadline for testing: ${jobsToExpire.map((j) => j.title).join(", ")}`);

  // ---------------------------------------------------------------------
  // Applications: each applicant applies to a handful of jobs
  // ---------------------------------------------------------------------
  const statusPool = ["applied", "applied", "shortlisted", "rejected"]; // weighted toward "applied"
  const applicationDocs = [];

  applicants.forEach((applicant) => {
    const targetJobs = pick(jobs, 3 + Math.floor(Math.random() * 3)); // 3-5 applications each
    targetJobs.forEach((job) => {
      applicationDocs.push({
        job: job._id,
        applicant: applicant._id,
        recruiter: job.recruiter,
        status: statusPool[Math.floor(Math.random() * statusPool.length)],
        resumeUrl: applicant.resumeUrl,
        coverNote: "",
      });
    });
  });

  // De-duplicate in case the same applicant/job pair was picked twice
  const seen = new Set();
  const uniqueApplications = applicationDocs.filter((a) => {
    const key = `${a.job}-${a.applicant}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await Application.create(uniqueApplications);
  console.log(`Created ${uniqueApplications.length} applications.`);

  // ---------------------------------------------------------------------
  // Bookmarks: each applicant bookmarks a couple of jobs they didn't apply to
  // ---------------------------------------------------------------------
  const bookmarkDocs = [];
  applicants.forEach((applicant) => {
    const appliedJobIds = new Set(
      uniqueApplications.filter((a) => a.applicant.equals(applicant._id)).map((a) => a.job.toString())
    );
    const candidates = jobs.filter((j) => !appliedJobIds.has(j._id.toString()));
    pick(candidates, 2).forEach((job) => {
      bookmarkDocs.push({ applicant: applicant._id, job: job._id });
    });
  });

  await Bookmark.create(bookmarkDocs);
  console.log(`Created ${bookmarkDocs.length} bookmarks.`);

  // ---------------------------------------------------------------------
  console.log("\nSeed complete.");
  console.log(`Users: ${recruiters.length} recruiters, ${applicants.length} applicants (${recruiters.length + applicants.length} total)`);
  console.log(`Jobs: ${jobs.length}`);
  console.log("\nDemo logins (all passwords: password123):");
  console.log("  Recruiter: recruiter@demo.com  (Nimbus Tech — has the most seeded applicants)");
  console.log("  Applicant: applicant@demo.com");
  console.log("\nOther seeded accounts: karan@vertexsystems.demo, ananya@bluepeaklabs.demo,");
  console.log("rohit@solsticeanalytics.demo (recruiters); sneha@, vikram@, fatima@, aditya@,");
  console.log("meera@, rahul@, divya@demo.com (applicants) — same password for all.");

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
