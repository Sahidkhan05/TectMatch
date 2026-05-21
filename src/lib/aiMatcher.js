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

Return ONLY this JSON, no extra text, no markdown:
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
    const apiKey = process.env.GROQ_API_KEY;
    console.log("GROQ API KEY EXISTS:", !!apiKey);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      }
    );

    const data = await response.json();
    console.log("GROQ STATUS:", response.status);
    console.log("GROQ DATA:", JSON.stringify(data, null, 2));

    const rawText = data?.choices?.[0]?.message?.content || "";

    if (!rawText) {
      throw new Error("Groq se koi response nahi aaya");
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    return { success: true, result };
  } catch (error) {
    console.error("AI Matcher Error:", error.message);
    return { success: false, error: error.message };
  }
}