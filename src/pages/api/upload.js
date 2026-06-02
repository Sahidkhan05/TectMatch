// src/pages/api/upload.js

import multer from 'multer';
import path from 'path';
import supabase from '../../lib/supabase';
import { matchResumeWithJD } from '../../lib/aiMatcher';
import { extractPdfText } from '../../lib/pdfTextExtractor';

const MAX_RESUMES_PER_REQUEST = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function splitSkills(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function uniqueSkills(skills) {
  return Array.from(new Set(skills.filter(Boolean)));
}

function normalizeProjectValidation(result) {
  const explicitValidation = Array.isArray(result.project_validation) ? result.project_validation : [];

  if (explicitValidation.length > 0) {
    return explicitValidation.map((item) => ({
      jdRequirement: item.jd_requirement || item.jdRequirement || '',
      evidenceFound: item.evidence_found || item.evidenceFound || '',
      validationStatus: item.validation_status || item.validationStatus || 'partial',
    }));
  }

  return (result.semantic_matches || []).map((match) => ({
    jdRequirement: match.jd_requirement || '',
    evidenceFound: match.resume_evidence || '',
    validationStatus: match.relevance === 'high' ? 'validated' : match.relevance === 'low' ? 'missing' : 'partial',
  }));
}

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
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    files: MAX_RESUMES_PER_REQUEST,
    fileSize: MAX_FILE_SIZE_BYTES,
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
    const requiredSkills = splitSkills(jobDetails?.skills);
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

    const results = [];

    for (const file of req.files) {
      results.push(await processResumeFile(file, jdText, requiredSkills));
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
}

async function processResumeFile(file, jdText, requiredSkills = []) {
  const candidateFallbackName = file.originalname.replace(/\.pdf$/i, '');

  try {
    const extractedText = await extractPdfText(file.buffer);

    if (!extractedText) {
      throw new Error('PDF text could not be extracted');
    }

    if (!jdText) {
      return {
        originalFileName: file.originalname,
        candidateName: candidateFallbackName,
        matchScore: '0%',
        requiredSkills,
        candidateSkills: [],
        coveredSkills: [],
        partialSkills: [],
        matchedSkills: [],
        missingSkills: [],
        strengths: [],
        weaknesses: ['No job description provided for matching.'],
        recommendation: 'Low Fit'
      };
    }

    const { success, result, error } = await matchResumeWithJD(jdText, extractedText);

    if (!success || !result) {
      throw new Error(error || 'AI matching failed');
    }

    const coveredSkills = result.matched_skills || [];
    const candidateSkills = uniqueSkills([
      ...(result.candidate_skills || []),
      ...coveredSkills,
    ]);
    const missingSkills = result.missing_skills || [];
    const partialSkills = result.partial_skills || [];

    return {
      originalFileName: file.originalname,
      candidateName: result.candidate_name || candidateFallbackName,
      appliedRole: result.applied_role || '',
      domain: result.domain || 'tech',
      matchScore: `${result.match_score}%`,
      requiredSkills: result.required_skills?.length ? result.required_skills : requiredSkills,
      candidateSkills,
      coveredSkills,
      partialSkills,
      matchedSkills: coveredSkills,
      missingSkills,
      semanticMatches: result.semantic_matches || [],
      projectValidation: normalizeProjectValidation(result),
      experienceMatch: result.experience_match || false,
      educationMatch: result.education_match || false,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || 'Low Fit',
      reasoning: result.reasoning || ''
    };
  } catch (parseError) {
    console.error(`Error processing ${file.originalname}:`, parseError.message);

    return {
      originalFileName: file.originalname,
      candidateName: candidateFallbackName,
      matchScore: '0%',
      requiredSkills,
      candidateSkills: [],
      coveredSkills: [],
      partialSkills: [],
      matchedSkills: [],
      missingSkills: [],
      projectValidation: [],
      strengths: [],
      weaknesses: ['Error processing this resume.'],
      recommendation: 'Error'
    };
  }
}
