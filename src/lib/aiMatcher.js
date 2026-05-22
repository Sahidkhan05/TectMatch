export async function matchResumeWithJD(jdText, resumeText) {
  const cleanJD = jdText?.trim().slice(0, 2000) || "";
  const cleanResume = resumeText?.trim().slice(0, 3000) || "";

  const prompt = `You are an expert ATS engine and HR analyst.
Match the resume with the job description semantically.

Rules:
- Semantic matching not just keywords
- Normalize skills: React.js=React, Node.js=Node.js, Github=Git
- Handle tech and non-tech domains
- Extract implied skills from context
- Scoring: 80-100 Highly Suitable, 50-79 Moderate Fit, 0-49 Low Fit

Job Description:
"""
${cleanJD}
"""

Resume:
"""
${cleanResume}
"""

Return ONLY this JSON, no extra text, no markdown, no explanation:
{
  "candidate_name": "",
  "applied_role": "",
  "domain": "tech OR non-tech OR hybrid",
  "match_score": 0,
  "matched_skills": [],
  "missing_skills": [],
  "semantic_matches": [{"jd_requirement": "", "resume_evidence": "", "relevance": "high OR medium OR low"}],
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

    const response = await fetch(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      }
    );

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log(data);

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        "Cerebras API failed"
      );
    }

    const rawText =
      data?.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Empty AI response");
    }

    let result;

    try {
      const cleaned = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      result = JSON.parse(cleaned);

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