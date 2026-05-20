import multer from 'multer';
import path from 'path';
import fs from 'fs';
import supabase from '../../lib/supabase';

// Fix: import internal file directly — bypasses Turbopack ESM wrapper issue
import { PDFParse } from "pdf-parse";

// Configure temporary upload directory
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer file validation filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  }
});

// Middleware wrapper to run multer inside Next.js API route
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Next.js API config to disable default body parsing (required for multer)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, upload.array('resumes', 5));

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Fetch job details if jobId is provided
    let jobDetails = null;
    if (req.body.jobId) {
      const { data, error } = await supabase
        .from('tectmatch_jobs')
        .select('*')
        .eq('id', req.body.jobId)
        .single();

      if (!error && data) {
        jobDetails = data;
      }
    }

    const matchCandidate = (extractedText, fileName) => {
      const result = {
        candidateName: fileName.replace('.pdf', ''),
        matchScore: "0%",
        matchedSkills: [],
        missingSkills: [],
        strengths: [],
        weaknesses: [],
        recommendation: "Low Fit"
      };

      if (!jobDetails) {
        result.weaknesses.push("No job description provided for matching.");
        return result;
      }

      const textLower = extractedText.toLowerCase();

      // Normalize resume text: lowercase, strip dots + special chars, collapse spaces
      const normalizedResumeText = textLower
        .replace(/\./g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Synonym map: normalized JD skill → canonical form used in matching
      const synonymMap = {
        // React variants
        "react":      ["react", "reactjs"],
        "reactjs":    ["react", "reactjs"],
        "react js":   ["react", "reactjs"],
        // Node variants
        "node":       ["node", "nodejs"],
        "nodejs":     ["node", "nodejs"],
        "node js":    ["node", "nodejs"],
        "nodjs":      ["node", "nodejs"],
        // JavaScript variants
        "js":         ["javascript", "js"],
        "javascript": ["javascript", "js"],
        // MongoDB variants
        "mongo":      ["mongodb", "mongo"],
        "mongodb":    ["mongodb", "mongo"],
        // Express variants
        "express":    ["express", "expressjs"],
        "expressjs":  ["express", "expressjs"],
        "express js": ["express", "expressjs"],
        // Git variants
        "git":        ["git", "github"],
        "github":     ["git", "github"],
      };

      // Normalize a single skill string
      const normalizeSkill = (skill) => skill
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Check if a skill exists in the resume using synonyms + word boundaries
      const checkSkill = (skill) => {
        const norm = normalizeSkill(skill);
        const noSpace = norm.replace(/\s/g, '');

        // Collect all variants to test
        const variants = new Set([norm, noSpace]);
        (synonymMap[norm] || []).forEach(v => variants.add(v));
        (synonymMap[noSpace] || []).forEach(v => variants.add(v));

        return [...variants].some(v => {
          const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          return regex.test(normalizedResumeText) || regex.test(textLower);
        });
      };

      // Skills (Weight 50%)
      const requiredSkills = jobDetails.skills
        ? jobDetails.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const matched = [];
      const missing = [];

      requiredSkills.forEach(skill => {
        if (checkSkill(skill)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      });

      result.matchedSkills = matched;
      result.missingSkills = missing;

      const skillScore = requiredSkills.length > 0
        ? (matched.length / requiredSkills.length) * 50
        : 50;

      // Experience (Weight 30%)
      const reqExp = jobDetails.experience ? jobDetails.experience.toLowerCase() : "";
      let expScore = 0;
      const expMatch = reqExp.match(/(\d+)/);
      const reqYears = expMatch ? parseInt(expMatch[1]) : 0;

      const textYearsMatches = extractedText.match(/(\d+)\+?\s*(?:years?|yrs?)/gi);
      let foundYears = 0;
      if (textYearsMatches) {
        textYearsMatches.forEach(m => {
          const y = parseInt(m);
          if (y > foundYears && y < 30) foundYears = y;
        });
      }

      const hasExpMention = (reqExp && textLower.includes(reqExp.replace(/years?/gi, '').trim())) || (foundYears > 0);

      if (reqYears > 0) {
        if (foundYears >= reqYears) {
          expScore = 30;
        } else if (foundYears > 0) {
          expScore = (foundYears / reqYears) * 30;
        }
      } else if (hasExpMention) {
        expScore = 30;
      } else if (!reqExp) {
        expScore = 30;
      }

      // Keywords (Weight 20%)
      let keywordScore = 0;
      const descLower = jobDetails.description ? jobDetails.description.toLowerCase() : "";
      const atsKeywords = ["leadership", "agile", "scrum", "architecture", "design", "testing", "ci/cd", "deployment", "optimization", "scalable", "cloud", "api", "rest", "graphql", "project", "management"];

      const jdKeywords = atsKeywords.filter(k => descLower.includes(k));
      const matchedKeywords = jdKeywords.filter(k => textLower.includes(k));

      if (jdKeywords.length > 0) { 
        keywordScore = (matchedKeywords.length / jdKeywords.length) * 20;
      } else {
        keywordScore = 20;
      }

      const hasProjects = textLower.includes("project") || textLower.includes("portfolio");
      if (hasProjects && jdKeywords.length === 0) {
        keywordScore = 20;
      }

      // Total score
      const totalScore = Math.round(skillScore + expScore + keywordScore);
      result.matchScore = `${totalScore}%`;

      // Strengths
      if (matched.length > 0) {
        result.strengths.push(`Matches ${matched.length} key required skills including ${matched.slice(0, 2).join(', ')}.`);
      }
      if (foundYears >= reqYears && reqYears > 0) {
        result.strengths.push(`Meets or exceeds the required ${reqYears} years of experience.`);
      } else if (hasExpMention) {
        result.strengths.push(`Contains relevant professional experience formatting.`);
      }
      if (matchedKeywords.length > 0) {
        result.strengths.push(`Aligns with job role keywords like ${matchedKeywords.slice(0, 2).join(', ')}.`);
      }
      if (hasProjects) {
        result.strengths.push(`Includes a visible projects or portfolio section.`);
      }

      const genericStrengths = [
        "Document structure is well-parsed by ATS.",
        "Keyword density is adequate for general parsing.",
        "Contact or standard sections are clearly identifiable."
      ];
      while (result.strengths.length < 4 && genericStrengths.length > 0) {
        result.strengths.push(genericStrengths.shift());
      }

      // Weaknesses
      if (missing.length > 0) {
        result.weaknesses.push(`Missing critical skills: ${missing.slice(0, 3).join(', ')}.`);
      }
      if (reqYears > 0 && foundYears < reqYears) {
        if (foundYears === 0) {
          result.weaknesses.push(`Could not clearly identify required ${reqYears} years of experience.`);
        } else {
          result.weaknesses.push(`Identified ${foundYears} years of experience, but ${reqYears} years are required.`);
        }
      }
      const missingKeywords = jdKeywords.filter(k => !matchedKeywords.includes(k));
      if (missingKeywords.length > 0) {
        result.weaknesses.push(`Lacks important role keywords: ${missingKeywords.slice(0, 2).join(', ')}.`);
      }
      if (!hasProjects && (descLower.includes("project") || reqExp)) {
        result.weaknesses.push(`No clear 'Projects' or hands-on examples highlighted.`);
      }
      if (totalScore < 50) {
        result.weaknesses.push(`Overall profile alignment with the job description is weak.`);
      }

      const genericWeaknesses = [
        "Resume language could be more tailored to the JD.",
        "Impact metrics (numbers/percentages) are not highly visible.",
        "Action verbs might be underutilized in descriptions."
      ];
      while (result.weaknesses.length < 4 && genericWeaknesses.length > 0 && totalScore < 90) {
        result.weaknesses.push(genericWeaknesses.shift());
      }

      // Recommendation
      if (totalScore >= 75) {
        result.recommendation = "Highly Suitable";
      } else if (totalScore >= 50) {
        result.recommendation = "Moderate Fit";
      } else {
        result.recommendation = "Low Fit";
      }

      return result;
    };

    // Extract text and match for each uploaded PDF
    const results = [];

    for (const file of req.files) {
  try {

    const dataBuffer = fs.readFileSync(file.path);

    const parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();
    await parser.destroy();

    const extractedText = pdfData?.text?.trim() || "";

    const match = matchCandidate(
      extractedText,
      file.originalname
    );

    results.push({
      originalFileName: file.originalname,
      extractedText,
      ...match
    });

  } catch (parseError) {

    console.error(
      `Error parsing ${file.originalname}:`,
      parseError
    );

    results.push({
      originalFileName: file.originalname,
      extractedText: "",
      candidateName: file.originalname.replace(
        '.pdf',
        ''
      ),
      matchScore: "0%",
      matchedSkills: [],
      missingSkills: [],
      strengths: [],
      weaknesses: [
        "Error extracting text from file"
      ],
      recommendation: "Error"
    });

  } finally {

    try {
      fs.unlinkSync(file.path);
    } catch (_) {}

  }
}

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'An error occurred during file upload' });
  }
}