// src/pages/api/upload.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import supabase from '../../lib/supabase';
import { matchResumeWithJD } from '../../lib/aiMatcher';
import { extractPdfText } from '../../lib/pdfTextExtractor';

// Temp upload directory
const uploadDir = path.join(os.tmpdir(), 'tectmatch-uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Multer init
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  }
});

// Middleware wrapper
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

// Next.js config
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

    // Supabase se job fetch karo
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

    // JD text banao
    const jdText = jobDetails
      ? [
          jobDetails.title,
          jobDetails.skills,
          jobDetails.experience,
          jobDetails.description
        ]
          .filter(Boolean)
          .join('\n')
      : null;

    // Har resume process karo one by one
    const results = [];

    for (const file of req.files) {
      try {
        // PDF text extract karo
        const dataBuffer = fs.readFileSync(file.path);
        const extractedText = await extractPdfText(dataBuffer);

        if (!extractedText) {
          throw new Error('PDF se text extract nahi hua');
        }

        // JD nahi hai toh error
        if (!jdText) {
          results.push({
            originalFileName: file.originalname,
            candidateName: file.originalname.replace(/\.pdf$/i, ''),
            matchScore: '0%',
            matchedSkills: [],
            missingSkills: [],
            strengths: [],
            weaknesses: ['No job description provided for matching.'],
            recommendation: 'Low Fit'
          });
          continue;
        }

        // AI se match karo
        const { success, result, error } = await matchResumeWithJD(jdText, extractedText);

        if (!success || !result) {
          throw new Error(error || 'AI matching failed');
        }

        // Result push karo
        results.push({
          originalFileName: file.originalname,
          candidateName: result.candidate_name || file.originalname.replace(/\.pdf$/i, ''),
          appliedRole: result.applied_role || '',
          domain: result.domain || 'tech',
          matchScore: `${result.match_score}%`,
          matchedSkills: result.matched_skills || [],
          missingSkills: result.missing_skills || [],
          semanticMatches: result.semantic_matches || [],
          experienceMatch: result.experience_match || false,
          educationMatch: result.education_match || false,
          strengths: result.strengths || [],
          weaknesses: result.weaknesses || [],
          recommendation: result.recommendation || 'Low Fit',
          reasoning: result.reasoning || ''
        });

      } catch (parseError) {
        console.error(`Error processing ${file.originalname}:`, parseError.message);

        results.push({
          originalFileName: file.originalname,
          candidateName: file.originalname.replace(/\.pdf$/i, ''),
          matchScore: '0%',
          matchedSkills: [],
          missingSkills: [],
          strengths: [],
          weaknesses: ['Error processing this resume.'],
          recommendation: 'Error'
        });

      } finally {
        // Temp file delete karo
        try {
          fs.unlinkSync(file.path);
        } catch (_) {}
      }
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
}
