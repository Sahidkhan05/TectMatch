const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";
const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_MAX_RETRIES = 1;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAiCompletion(options) {
  let lastError;

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(CEREBRAS_API_URL, options, AI_REQUEST_TIMEOUT_MS);

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === AI_MAX_RETRIES) {
        return response;
      }

      lastError = new Error(`Cerebras API returned retryable status ${response.status}`);
    } catch (error) {
      lastError = error;

      if (error.name !== "AbortError" && attempt === AI_MAX_RETRIES) {
        throw error;
      }

      if (attempt === AI_MAX_RETRIES) {
        throw new Error("AI request timed out");
      }
    }

    await delay(500 * (attempt + 1));
  }

  throw lastError || new Error("Cerebras API failed");
}

export async function matchResumeWithJD(jdText, resumeText) {
  const cleanJD = jdText?.trim().slice(0, 1500) || "";
  const cleanResume = resumeText?.trim().slice(0, 2000) || "";

  const prompt = `You are an ATS engine. Analyze the resume against the job description and return ONLY a JSON object.

Job Description:
"""
${cleanJD}
"""

Resume:
"""
${cleanResume}
"""

Return ONLY this JSON object, no thinking, no explanation, no markdown:
{
  "candidate_name": "",
  "applied_role": "",
  "domain": "tech OR non-tech OR hybrid",
  "match_score": 0,
  "required_skills": [],
  "candidate_skills": [],
  "matched_skills": [],
  "missing_skills": [],
  "partial_skills": [],
  "semantic_matches": [{"jd_requirement": "", "resume_evidence": "", "relevance": "high OR medium OR low"}],
  "project_validation": [{"jd_requirement": "", "evidence_found": "", "validation_status": "validated OR partial OR missing"}],
  "experience_match": true,
  "education_match": true,
  "strengths": [],
  "weaknesses": [],
  "recommendation": "Highly Suitable OR Moderate Fit OR Low Fit",
  "reasoning": ""
}`;

  try {
    const apiKey = process.env.CEREBRAS_API_KEY;

    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY missing");
    }

    const response = await fetchAiCompletion({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error?.message ||
        data?.error ||
        "Cerebras API failed"
      );
    }

    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Empty AI response");
    }

    let result;

    try {
      const cleaned = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      result = JSON.parse(jsonMatch[0]);

    } catch {
      throw new Error("Invalid JSON from AI");
    }

    return {
      success: true,
      result,
    };

  } catch (error) {
    console.error("AI Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
