// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");

const seed = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([User.deleteMany({}), Job.deleteMany({})]);

  const recruiter = await User.create({
    name: "Priya Sharma",
    email: "recruiter@demo.com",
    password: "password123",
    role: "recruiter",
    companyName: "Nimbus Tech",
    website: "https://nimbustech.example.com",
    aboutCompany: "Nimbus Tech builds cloud-native developer tools.",
  });

  const applicant = await User.create({
    name: "Arjun Rao",
    email: "applicant@demo.com",
    password: "password123",
    role: "applicant",
    skills: ["React", "Redux Toolkit", "Node.js", "MongoDB"],
    experience: "2 years",
    bio: "Frontend-leaning full-stack developer who loves building clean UIs.",
    resumeUrl: "https://example.com/resume/arjun-rao.pdf",
  });

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  await Job.create([
    {
      recruiter: recruiter._id,
      title: "Frontend Engineer",
      company: "Nimbus Tech",
      description: "Build and maintain our React-based dashboard used by thousands of developers daily.",
      skills: ["React", "Redux Toolkit", "TypeScript"],
      salary: 1200000,
      experience: "1-3",
      location: "Bengaluru",
      employmentType: "Full-time",
      workMode: "Hybrid",
      applicationDeadline: deadline,
    },
    {
      recruiter: recruiter._id,
      title: "Backend Engineer",
      company: "Nimbus Tech",
      description: "Design and scale our Node.js/MongoDB services powering the Nimbus platform.",
      skills: ["Node.js", "Express", "MongoDB"],
      salary: 1400000,
      experience: "3-5",
      location: "Remote",
      employmentType: "Full-time",
      workMode: "Remote",
      applicationDeadline: deadline,
    },
  ]);

  console.log("Seed complete.");
  console.log("Recruiter login: recruiter@demo.com / password123");
  console.log("Applicant login: applicant@demo.com / password123");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
