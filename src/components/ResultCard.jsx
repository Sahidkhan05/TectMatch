"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../lib/supabase";
import {
  FaCheck,
  FaDownload,
  FaFileAlt,
  FaRegStickyNote,
  FaSave,
  FaSearch,
  FaTimes,
  FaUserTie,
} from "react-icons/fa";

const CANDIDATE_STATUSES = ["New", "Reviewing", "Shortlisted", "Interview", "Rejected", "Hired"];

function normalizeStatus(status) {
  return CANDIDATE_STATUSES.includes(status) ? status : "New";
}

function getCandidateName(result, fileName) {
  return result.candidateName || fileName.replace(/\.[^/.]+$/, "") || "Candidate";
}

function uniqueList(values) {
  return Array.from(new Set((values || []).map((value) => String(value).trim()).filter(Boolean)));
}

function normalizeSkillName(input) {
  if (!input) return "";
  const s = String(input).trim();
  const low = s.toLowerCase();

  // Direct mappings / aliases
  if (/^react(\.js|js)?$/i.test(s) || /^react(js)?$/i.test(low)) return "React";
  if (/^node(\.js)?$/i.test(s) || /^node$/i.test(low)) return "Node.js";
  if (/^github$/i.test(s) || /^git hub$/i.test(low)) return "Git";
  if (/rest\s*apis?$/i.test(s) || /restful/i.test(s) || /rest\s*api/i.test(low)) return "REST API";

  // Generic cleanup: remove trailing dots, normalize spacing and capitalization
  const cleaned = s.replace(/\.+$/g, "").replace(/\s+/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeTextSkills(text) {
  if (!text) return "";
  let out = String(text);
  // Replace common aliases within longer text
  out = out.replace(/\breact(\.js|js)?\b/gi, "React");
  out = out.replace(/\bnode(\.js)?\b/gi, "Node.js");
  out = out.replace(/\bgithub\b/gi, "Git");
  out = out.replace(/\brest\s*apis?\b/gi, "REST API");
  out = out.replace(/\brestful\s*api\b/gi, "REST API");
  return out;
}

function SkillBadge({ children, tone = "gray" }) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    gray: "border-gray-200 bg-gray-50 text-gray-700",
  }[tone];

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function SmallBadge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
      {children}
    </span>
  );
}

function DonutChart({ covered = 0, partial = 0, missing = 0, total = 0 }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const safeTotal = total || covered + partial + missing || 1;
  const coveredPct = covered / safeTotal;
  const partialPct = partial / safeTotal;
  const missingPct = missing / safeTotal;

  const coveredDash = `${Math.round(circumference * coveredPct)} ${Math.round(circumference)}`;
  const partialDash = `${Math.round(circumference * partialPct)} ${Math.round(circumference)}`;
  const missingDash = `${Math.round(circumference * missingPct)} ${Math.round(circumference)}`;

  const startOffset = circumference * 0.25;
  const coveredOffset = 0;
  const partialOffset = -Math.round(circumference * coveredPct);
  const missingOffset = -Math.round(circumference * (coveredPct + partialPct));

  const percent = total > 0 ? Math.round((covered / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        <g transform="translate(60,60)">
          <circle r={radius} cx="0" cy="0" fill="transparent" stroke="#f3f4f6" strokeWidth="18" />
          <g transform={`rotate(-90)`}>
            <circle r={radius} cx="0" cy="0" fill="transparent" stroke="#10b981" strokeWidth="18" strokeLinecap="round" strokeDasharray={coveredDash} strokeDashoffset={coveredOffset - startOffset} />
            {partial > 0 && (
              <circle r={radius} cx="0" cy="0" fill="transparent" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" strokeDasharray={partialDash} strokeDashoffset={partialOffset - startOffset} />
            )}
            {missing > 0 && (
              <circle r={radius} cx="0" cy="0" fill="transparent" stroke="#fb7185" strokeWidth="18" strokeLinecap="round" strokeDasharray={missingDash} strokeDashoffset={missingOffset - startOffset} />
            )}
          </g>
        </g>
        <foreignObject x="30" y="30" width="60" height="60">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-extrabold text-gray-900">{percent}%</div>
              <div className="text-xs text-gray-500">Covered</div>
            </div>
          </div>
        </foreignObject>
      </svg>

      <div className="flex flex-col text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-gray-700">{covered}</span>
          <span className="text-gray-400">covered</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="font-semibold text-gray-700">{partial}</span>
          <span className="text-gray-400">partial</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="font-semibold text-gray-700">{missing}</span>
          <span className="text-gray-400">missing</span>
        </div>
      </div>
    </div>
  );
}

function ProjectSummary({ validations = [] }) {
  const counts = validations.reduce(
    (acc, item) => {
      const s = (item.validationStatus || item.status || "").toLowerCase();
      if (s === "validated") acc.validated += 1;
      else if (s === "missing") acc.missing += 1;
      else acc.partial += 1;
      return acc;
    },
    { validated: 0, partial: 0, missing: 0 }
  );

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm w-full">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">Project Validation</div>
      <div className="flex items-center gap-4 mt-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <div>
            <div className="font-semibold text-gray-800">{counts.validated}</div>
            <div className="text-xs text-gray-400">Validated</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <div>
            <div className="font-semibold text-gray-800">{counts.partial}</div>
            <div className="text-xs text-gray-400">Partial</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <div>
            <div className="font-semibold text-gray-800">{counts.missing}</div>
            <div className="text-xs text-gray-400">Missing</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ children }) {
  return <p className="text-sm text-gray-400">{children}</p>;
}

function WorkspaceSection({ title, icon: Icon, children }) {
  return (
    <section className="border-t border-gray-200 bg-white px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-gray-400" />
        <h4 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function ResultCard({ result, onSave, rank = 1, totalResults = 1 }) {
  const fileName = result.originalFileName || result.candidateName || "resume";
  const candidateName = getCandidateName(result, fileName);
  const scoreValue = useMemo(() => parseInt((result.matchScore || "0").replace("%", ""), 10) || 0, [result.matchScore]);
  const [saved, setSaved] = useState(false);
  const [savedResultId, setSavedResultId] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState(normalizeStatus(result.candidateStatus));
  const [recruiterNotes, setRecruiterNotes] = useState(result.recruiterNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  const skillCoverage = useMemo(() => {
    const normalizeArr = (arr) => uniqueList((arr || []).map(normalizeSkillName).filter(Boolean));

    const requiredSkills = normalizeArr(result.requiredSkills || []);
    const rawCovered = normalizeArr(result.coveredSkills || result.matchedSkills || []);
    const partialSkills = normalizeArr(result.partialSkills || []);
    // Ensure partial skills are not counted as fully covered
    const coveredSkills = rawCovered.filter((s) => !partialSkills.includes(s));
    // Missing = Required - Covered - Partial
    const missingSkills = requiredSkills.filter((r) => !coveredSkills.includes(r) && !partialSkills.includes(r));
    const candidateSkills = normalizeArr(result.candidateSkills || []);

    return {
      requiredSkills,
      candidateSkills,
      coveredSkills,
      missingSkills,
      partialSkills,
    };
  }, [result.candidateSkills, result.coveredSkills, result.matchedSkills, result.partialSkills, result.requiredSkills]);

  const initialLoadRef = useRef(true);
  const projectValidation = useMemo(() => {
    if (Array.isArray(result.projectValidation) && result.projectValidation.length > 0) {
      return result.projectValidation.map((it) => ({
        jdRequirement: normalizeTextSkills(it.requirement || it.jdRequirement || it.jd_requirement || ""),
        evidenceFound: normalizeTextSkills(it.evidence || it.evidenceFound || it.resumeEvidence || it.resume_evidence || ""),
        validationStatus: it.status || it.validationStatus || (it.validated ? "validated" : it.missing ? "missing" : "partial"),
      }));
    }

    return (result.semanticMatches || []).map((match) => ({
      jdRequirement: normalizeTextSkills(match.jd_requirement || match.requirement || ""),
      // prefer explicit resume evidence fields when available
      evidenceFound: normalizeTextSkills(match.evidenceFound || match.resumeEvidence || match.resume_evidence || match.evidence || ""),
      validationStatus: match.relevance === "high" ? "validated" : match.relevance === "low" ? "missing" : "partial",
    }));
  }, [result.projectValidation, result.semanticMatches]);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingWorkspace() {
      const { data, error } = await supabase
        .from("tectmatch_saved_results")
        .select("id, candidate_status, recruiter_notes")
        .eq("candidate_name", candidateName)
        .eq("resume_name", fileName)
        .maybeSingle();

      if (!isMounted || error || !data) {
        return;
      }

      setSavedResultId(data.id);
      setSaved(true);
      setCandidateStatus(normalizeStatus(data.candidate_status));
      setRecruiterNotes(data.recruiter_notes || "");
    }

    loadExistingWorkspace();

    return () => {
      isMounted = false;
    };
  }, [candidateName, fileName]);

  const workspacePayload = useMemo(
    () => ({
      candidate_name: candidateName,
      resume_name: fileName,
      match_score: scoreValue,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || "",
      candidate_status: candidateStatus,
      recruiter_notes: recruiterNotes,
      required_skills: skillCoverage.requiredSkills,
      candidate_skills: skillCoverage.candidateSkills,
      covered_skills: skillCoverage.coveredSkills,
      missing_skills: skillCoverage.missingSkills,
      partial_skills: skillCoverage.partialSkills,
      project_validation: projectValidation,
    }),
    [
      candidateName,
      candidateStatus,
      fileName,
      projectValidation,
      recruiterNotes,
      result.recommendation,
      result.strengths,
      result.weaknesses,
      scoreValue,
      skillCoverage,
    ]
  );

  const handleDownload = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("TectMatch Recruiter Workspace", 14, 22);
    doc.setFontSize(12);
    doc.text(`Candidate: ${candidateName}`, 14, 35);
    doc.text(`Resume: ${fileName}`, 14, 43);
    doc.text(`Status: ${candidateStatus}`, 14, 51);
    doc.text(`Reference Score: ${scoreValue}%`, 14, 59);

    autoTable(doc, {
      startY: 68,
      head: [["Required", "Covered", "Partial", "Missing"]],
      body: [[
        skillCoverage.requiredSkills.join(", ") || "None",
        skillCoverage.coveredSkills.join(", ") || "None",
        skillCoverage.partialSkills.join(", ") || "None",
        skillCoverage.missingSkills.join(", ") || "None",
      ]],
      theme: "grid",
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Requirement", "Evidence", "Status"]],
      body: projectValidation.length > 0
        ? projectValidation.map((item) => [item.jdRequirement, item.evidenceFound || "None", item.validationStatus])
        : [["None", "None", "missing"]],
      theme: "grid",
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Recruiter Notes"]],
      body: [[recruiterNotes || "No notes added."]],
      theme: "grid",
    });

    doc.save(`${candidateName}-workspace.pdf`);
  };

  const saveWorkspace = async (opts = { silent: false }) => {
    try {
      if (savedResultId) {
        const { error } = await supabase
          .from("tectmatch_saved_results")
          .update(workspacePayload)
          .eq("id", savedResultId);

        if (error) throw error;
      } else {
        const { data: existingData, error: checkError } = await supabase
          .from("tectmatch_saved_results")
          .select("id")
          .eq("candidate_name", candidateName)
          .eq("resume_name", fileName)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingData) {
          const { error } = await supabase
            .from("tectmatch_saved_results")
            .update(workspacePayload)
            .eq("id", existingData.id);

          if (error) throw error;
          setSavedResultId(existingData.id);
        } else {
          const { data, error } = await supabase
            .from("tectmatch_saved_results")
            .insert([workspacePayload])
            .select("id")
            .single();

          if (error) throw error;
          setSavedResultId(data.id);
        }
      }

      setSaved(true);
    } catch (error) {
      if (!opts.silent) {
        console.error("Error saving recruiter workspace:", error);
        alert("Failed to save recruiter workspace. Please try again.");
      } else {
        console.error("Auto-save failed:", error);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveWorkspace({ silent: false });
    setIsSaving(false);
    if (typeof onSave === "function") onSave({ ...result, candidateStatus, recruiterNotes });
  };

  // Auto-save status and notes after brief debounce, but skip initial load
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    const t = setTimeout(() => {
      saveWorkspace({ silent: true });
    }, 1200);

    return () => clearTimeout(t);
  }, [candidateStatus, recruiterNotes]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <section className="bg-white px-4 sm:px-5 md:px-6 py-5 sm:py-6">
        <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              <FaUserTie />
              Candidate Workspace
            </div>
            <h3 className="truncate text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-gray-950">{candidateName}</h3>
            
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
              <SmallBadge>{fileName}</SmallBadge>
              <SmallBadge>Rank #{rank} of {totalResults}</SmallBadge>
              <SmallBadge>Reference: {scoreValue}%</SmallBadge>
            </div>

            {/* Charts - Stack on mobile, side-by-side on larger screens */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <DonutChart
                  covered={skillCoverage.coveredSkills.length}
                  partial={skillCoverage.partialSkills.length}
                  missing={skillCoverage.missingSkills.length}
                  total={skillCoverage.requiredSkills.length}
                />
              </div>
              <div className="flex flex-col gap-3">
                <ProjectSummary validations={projectValidation} />
              </div>
            </div>
          </div>

          {/* Status Dropdown - Full width on mobile, fixed width on desktop */}
          <div className="w-full sm:w-auto lg:w-64">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Candidate Status</span>
              <select
                value={candidateStatus}
                onChange={(event) => setCandidateStatus(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none touch-target w-full"
              >
                {CANDIDATE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <WorkspaceSection title="Skill Coverage" icon={FaCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Required Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillCoverage.requiredSkills.length > 0 ? skillCoverage.requiredSkills.map((skill) => <SkillBadge key={skill}>{skill}</SkillBadge>) : <EmptyState>No required skills found.</EmptyState>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Candidate Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillCoverage.candidateSkills.length > 0 ? skillCoverage.candidateSkills.map((skill) => <SkillBadge key={skill} tone="blue">{skill}</SkillBadge>) : <EmptyState>No candidate skills found.</EmptyState>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Covered Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillCoverage.coveredSkills.length > 0 ? skillCoverage.coveredSkills.map((skill) => <SkillBadge key={skill} tone="emerald">{skill}</SkillBadge>) : <EmptyState>No covered skills detected.</EmptyState>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Partial Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillCoverage.partialSkills.length > 0 ? skillCoverage.partialSkills.map((skill) => <SkillBadge key={skill} tone="amber">{skill}</SkillBadge>) : <EmptyState>No partial skills detected.</EmptyState>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Missing Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillCoverage.missingSkills.length > 0 ? skillCoverage.missingSkills.map((skill) => <SkillBadge key={skill} tone="rose">{skill}</SkillBadge>) : <EmptyState>No missing skills detected.</EmptyState>}
            </div>
          </div>
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="Project Validation" icon={FaSearch}>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 sm:space-y-4">
          {projectValidation.length > 0 ? projectValidation.map((item, index) => (
            <div key={`${item.jdRequirement}-${index}`} className="border border-gray-100 rounded-xl p-3 sm:p-4 space-y-2 bg-gray-50/50">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">Requirement</p>
                <p className="text-sm font-semibold text-gray-900">{item.jdRequirement || "Requirement not specified"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">Evidence</p>
                <p className="text-sm text-gray-600">{item.evidenceFound || "No evidence found"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">Status</p>
                <SkillBadge tone={item.validationStatus === "validated" ? "emerald" : item.validationStatus === "missing" ? "rose" : "amber"}>
                  {item.validationStatus ? item.validationStatus.charAt(0).toUpperCase() + item.validationStatus.slice(1) : "Partial"}
                </SkillBadge>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-sm text-gray-400">No project evidence returned by the matcher.</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-5 -mb-5 sm:-mx-6 md:-mx-0 md:mb-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-[0.14em] text-gray-400 bg-gray-50/50">
                <th className="py-3 px-5 sm:px-6 font-bold">Requirement</th>
                <th className="py-3 px-5 sm:px-6 font-bold">Evidence</th>
                <th className="py-3 px-5 sm:px-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectValidation.length > 0 ? projectValidation.map((item, index) => (
                <tr key={`${item.jdRequirement}-${index}`} className="border-b border-gray-50 align-top hover:bg-gray-50/30 transition-colors">
                  <td className="py-3 px-5 sm:px-6 font-semibold text-gray-900">{item.jdRequirement || "Requirement not specified"}</td>
                  <td className="py-3 px-5 sm:px-6 text-gray-600">{item.evidenceFound || "No evidence found"}</td>
                  <td className="py-3 px-5 sm:px-6">
                    <SkillBadge tone={item.validationStatus === "validated" ? "emerald" : item.validationStatus === "missing" ? "rose" : "amber"}>
                      {item.validationStatus ? item.validationStatus.charAt(0).toUpperCase() + item.validationStatus.slice(1) : "Partial"}
                    </SkillBadge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-sm text-gray-400">No project evidence returned by the matcher.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="Recruiter Notes" icon={FaRegStickyNote}>
        <textarea
          value={recruiterNotes}
          onChange={(event) => setRecruiterNotes(event.target.value)}
          rows="4"
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none touch-target"
          placeholder="Add screening notes, clarification questions, interview feedback, or follow-up context..."
        />
      </WorkspaceSection>

      <section className="border-t border-gray-200 bg-gray-50 px-4 sm:px-5 md:px-6 py-5 sm:py-6">
        <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">Decision</div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Use status and notes as the recruiter-owned source of truth.</p>
          </div>
          
          {/* Action Buttons - Stack on mobile, flex on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-800 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 touch-target flex-1 sm:flex-none"
            >
              <FaDownload />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Download Workspace</span>
            </button>
            <button
              onClick={() => setCandidateStatus("Rejected")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 touch-target flex-1 sm:flex-none"
            >
              <FaTimes />
              <span>Reject</span>
            </button>
            <button
              onClick={() => setCandidateStatus("Interview")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 touch-target flex-1 sm:flex-none"
            >
              <FaSearch />
              <span>Interview</span>
            </button>
            <button
              onClick={() => setCandidateStatus("Shortlisted")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 touch-target flex-1 sm:flex-none"
            >
              <FaCheck />
              <span>Shortlist</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 touch-target flex-1 sm:flex-none"
            >
              <FaSave />
              <span>{isSaving ? "Saving..." : saved ? "Save Changes" : "Save Workspace"}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(ResultCard);
