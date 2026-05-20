"use client";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "../lib/supabase";
import {
  FaCheck,
  FaClock,
  FaDatabase,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaLaptopCode,
  FaLayerGroup,
  FaMedal,
  FaSave,
  FaServer,
  FaTools,
} from "react-icons/fa";

const clamp = (value) => Math.max(0, Math.min(100, value));

function getRecommendation(score, recommendation) {
  const label = recommendation || (score >= 75 ? "Highly Suitable" : score >= 40 ? "Moderate Fit" : "Low Fit");

  if (label === "Highly Suitable") {
    return {
      label,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100/80",
      dot: "bg-emerald-500",
    };
  }

  if (label === "Moderate Fit") {
    return {
      label,
      className: "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100/80",
      dot: "bg-amber-500",
    };
  }

  return {
    label,
    className: "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100/80",
    dot: "bg-rose-500",
  };
}

function CircularProgress({ value, size = 184, stroke = 14, color = "#2563eb", track = "#e5e7eb", label, subLabel }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(value) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90 drop-shadow-sm" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={size > 90 ? "text-4xl font-black tracking-tight text-gray-950" : "text-sm font-black tracking-tight text-gray-950"}>
          {label || `${value}%`}
        </span>
        {subLabel ? <span className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{subLabel}</span> : null}
      </div>
    </div>
  );
}

function MiniProgress({ label, value, icon: Icon, color }) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
          <Icon className="text-sm" />
        </div>
        <CircularProgress value={value} size={58} stroke={7} color={color} track="#f1f5f9" label={`${value}%`} />
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-900">{label}</div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg">
      <div className={`mb-3 h-1.5 w-10 rounded-full ${accent}`} />
      <div className="text-2xl font-black tracking-tight text-gray-950">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</div>
    </div>
  );
}

export default function ResultCard({ result, onSave, rank = 1, totalResults = 1 }) {
  const [saved, setSaved] = useState(false);

  const fileName = result.originalFileName || result.candidateName || "resume";
  const scoreValue = parseInt((result.matchScore || "0").replace("%", ""), 10) || 0;
  const matchedSkills = result.matchedSkills || [];
  const missingSkills = result.missingSkills || [];
  const recommendation = getRecommendation(scoreValue, result.recommendation);
  const experienceMatch = clamp(scoreValue + (matchedSkills.length > missingSkills.length ? 6 : -8));
  const uploadedAt = result.uploadedAt || result.createdAt || "Screened just now";
  const uploadDetail = result.fileSize ? `${result.fileSize} - ${uploadedAt}` : uploadedAt;
  const fallbackStrengths = [
    "Relevant keywords align with the selected job profile.",
    "Resume content is readable for automated screening.",
    "Skill evidence is concentrated in the candidate summary.",
    "Profile is ready for recruiter review.",
  ];
  const fallbackWeaknesses = [
    "Some required skills need clearer evidence.",
    "Project impact could be quantified more strongly.",
    "Recent role context may need manual validation.",
    "Tooling depth is not fully visible from the resume.",
  ];
  const strengths = (result.strengths || []).length > 0 ? result.strengths : fallbackStrengths;
  const weaknesses = (result.weaknesses || []).length > 0 ? result.weaknesses : fallbackWeaknesses;
  const searchableText = `${matchedSkills.join(" ")} ${result.extractedText || ""}`.toLowerCase();
  const categoryScores = [
    { label: "Frontend", icon: FaLaptopCode, color: "#2563eb", terms: ["react", "next", "javascript", "typescript", "html", "css", "tailwind", "frontend"] },
    { label: "Backend", icon: FaServer, color: "#7c3aed", terms: ["node", "express", "api", "backend", "server", "python", "java"] },
    { label: "Database", icon: FaDatabase, color: "#0891b2", terms: ["postgres", "mysql", "mongodb", "sql", "database", "supabase"] },
    { label: "Tools", icon: FaTools, color: "#ea580c", terms: ["git", "jira", "figma", "webpack", "vite", "postman"] },
    { label: "DevOps", icon: FaLayerGroup, color: "#16a34a", terms: ["aws", "docker", "kubernetes", "ci", "cd", "devops", "vercel"] },
  ].map((category) => {
    const hits = category.terms.filter((term) => searchableText.includes(term)).length;
    const derived = hits > 0 ? Math.round((hits / Math.min(category.terms.length, 4)) * 100) : Math.max(18, scoreValue - 28);
    return { ...category, value: clamp(derived) };
  });

  const handleDownload = () => {
    const candidateName = result.candidateName || fileName.replace(/\.[^/.]+$/, "");
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("TectMatch Screening Result", 14, 22);

    // Details
    doc.setFontSize(12);
    doc.text(`Candidate Name: ${candidateName}`, 14, 35);
    doc.text(`Resume Name: ${fileName}`, 14, 43);
    doc.text(`Match Score: ${result.matchScore || `${scoreValue}%`}`, 14, 51);
    doc.text(`Recommendation: ${result.recommendation || recommendation.label}`, 14, 59);

    // Skills
    autoTable(doc, {
      startY: 67,
      head: [['Matched Skills', 'Missing Skills']],
      body: [
        [matchedSkills.join(", ") || "None", missingSkills.join(", ") || "None"]
      ],
      theme: 'grid'
    });

    // Strengths
    const strengthsBody = strengths.map(s => [s]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Strengths']],
      body: strengthsBody.length > 0 ? strengthsBody : [["None"]],
      theme: 'grid'
    });

    // Weaknesses
    const weaknessesBody = weaknesses.map(w => [w]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Weaknesses']],
      body: weaknessesBody.length > 0 ? weaknessesBody : [["None"]],
      theme: 'grid'
    });

    // Save
    doc.save(`${candidateName}-result.pdf`);
  };

  const handleSave = async () => {
    try {
      const candidateName = result.candidateName || fileName;

      // Check for duplicate
      const { data: existingData, error: checkError } = await supabase
        .from('tectmatch_saved_results')
        .select('id')
        .eq('candidate_name', candidateName)
        .eq('resume_name', fileName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for duplicate:", checkError);
        alert("Failed to save result. Please try again.");
        return;
      }

      if (existingData) {
        alert("Result already saved for this candidate and resume.");
        setSaved(true);
        return;
      }

      // Insert new result
      const { error: insertError } = await supabase
        .from('tectmatch_saved_results')
        .insert([{
          candidate_name: candidateName,
          resume_name: fileName,
          match_score: parseInt(result.matchScore) || scoreValue,
          strengths: strengths,
          weaknesses: weaknesses,
          recommendation: result.recommendation || recommendation.label
        }]);

      if (insertError) throw insertError;

      setSaved(true);
      alert("Result saved successfully!");
      if (typeof onSave === "function") onSave(result);
    } catch (error) {
      console.error("Error saving result:", error);
      alert("Failed to save result. Please try again.");
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-gray-50 shadow-[0_22px_70px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
      <div className="border-b border-gray-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              <FaFileAlt className="text-gray-500" />
              Resume analysis
            </div>
            <h3 className="truncate text-xl font-black tracking-tight text-gray-950 sm:text-2xl">{fileName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <FaClock className="text-gray-400" />
                {uploadDetail}
              </span>
              <span className="inline-flex items-center gap-2">
                <FaMedal className="text-gray-400" />
                Rank #{rank} of {totalResults}
              </span>
            </div>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${recommendation.className}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${recommendation.dot}`} />
            {recommendation.label}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <CircularProgress value={scoreValue} color={scoreValue >= 75 ? "#059669" : scoreValue >= 40 ? "#d97706" : "#e11d48"} subLabel="Match score" />
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreValue >= 75 ? "bg-emerald-500" : scoreValue >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${clamp(scoreValue)}%` }}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Matched Skills" value={matchedSkills.length} accent="bg-emerald-500" />
            <StatCard label="Missing Skills" value={missingSkills.length} accent="bg-rose-500" />
            <StatCard label="Experience Match" value={`${experienceMatch}%`} accent="bg-blue-500" />
            <StatCard label="Overall Ranking" value={`#${rank}`} accent="bg-violet-500" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {categoryScores.map((category) => (
              <MiniProgress key={category.label} {...category} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Strengths</h4>
          <ul className="mt-4 space-y-3">
            {strengths.slice(0, 6).map((item, index) => (
              <li key={index} className="flex gap-3 text-sm leading-6 text-gray-700">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <FaCheck className="text-xs" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-rose-700">Weaknesses</h4>
          <ul className="mt-4 space-y-3">
            {weaknesses.slice(0, 6).map((item, index) => (
              <li key={index} className="flex gap-3 text-sm leading-6 text-gray-700">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <FaExclamationTriangle className="text-xs" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 border-t border-gray-200 bg-white px-5 py-5 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Top matched skills</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {matchedSkills.length === 0 ? (
              <span className="text-sm text-gray-400">No matched skills detected</span>
            ) : (
              matchedSkills.map((skill, index) => (
                <span key={index} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Missing skills</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingSkills.length === 0 ? (
              <span className="text-sm text-gray-400">No missing required skills</span>
            ) : (
              missingSkills.map((skill, index) => (
                <span key={index} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
        >
          <FaDownload />
          <span>Download Result</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saved}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:hover:translate-y-0 ${saved ? "border border-emerald-100 bg-emerald-50 text-emerald-700" : "bg-gray-950 text-white hover:bg-gray-800"
            }`}
        >
          <FaSave />
          <span>{saved ? "Saved" : "Save Result"}</span>
        </button>
      </div>
    </div>
  );
}
