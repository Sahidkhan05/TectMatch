"use client";
import Sidebar from "../../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import supabase from "../../lib/supabase";
import { FaCloudUploadAlt, FaFilePdf, FaTrash, FaCheckCircle, FaRobot } from "react-icons/fa";
import ResultCard from "../../components/ResultCard";

export default function ResumeScreening() {
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState("");
    const [files, setFiles] = useState([]);
    const [isScreening, setIsScreening] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState([]);
    
    const fileInputRef = useRef(null);

    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase.from('tectmatch_jobs').select('id, title').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setJobs(data);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            // Fallback for UI testing if Supabase is not configured yet
            setJobs([
                { id: '1', title: 'Frontend Developer' },
                { id: '2', title: 'Backend Developer' },
                { id: '3', title: 'UI/UX Designer' },
            ]);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchJobs();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
        // Reset input so the same file can be selected again if removed
        e.target.value = null;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const processFiles = (newFiles) => {
        const validFiles = newFiles.filter(file => file.type === 'application/pdf');
        
        if (validFiles.length !== newFiles.length) {
            alert("Only PDF files are allowed.");
        }

        setFiles(prev => {
            const combined = [...prev, ...validFiles];
            if (combined.length > 5) {
                alert("Maximum of 5 resumes allowed.");
                return combined.slice(0, 5);
            }
            return combined;
        });
    };

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const handleStartScreening = async () => {
        if (!selectedJob) {
            alert("Please select a job position first.");
            return;
        }
        if (files.length === 0) {
            alert("Please upload at least one resume.");
            return;
        }
        // Fetch job details from Supabase
        setIsScreening(true);
        let jobDetails = null;
        try {
            const { data, error } = await supabase.from('tectmatch_jobs').select('*').eq('id', selectedJob).single();
            if (error) throw error;
            jobDetails = data;
        } catch (err) {
            console.warn('Could not fetch job details from Supabase, continuing without JD specifics.', err);
        }

        // Prepare and send FormData to /api/upload
        const formData = new FormData();
        files.forEach((file) => formData.append('resumes', file));
        formData.append('jobId', selectedJob);

        try {
            const resp = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || 'Upload failed');
            }

            const data = await resp.json();

            // Compute JD matching on frontend using extracted text and jobDetails
            const computeMatch = (extractedText, originalFileName) => {
                const result = {
                    candidateName: originalFileName ? originalFileName.replace(/\.pdf$/i, '') : 'Unknown',
                    matchScore: '0%',
                    matchedSkills: [],
                    missingSkills: [],
                    strengths: [],
                    weaknesses: [],
                    recommendation: 'Low Fit',
                };

                if (!jobDetails) {
                    result.weaknesses.push('No job description provided for matching.');
                    return result;
                }

                const textLower = (extractedText || '').toLowerCase();

                const requiredSkills = jobDetails.skills
                    ? jobDetails.skills.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                const matched = [];
                const missing = [];
                requiredSkills.forEach(skill => {
                    if (skill && textLower.includes(skill.toLowerCase())) matched.push(skill);
                    else if (skill) missing.push(skill);
                });

                result.matchedSkills = matched;
                result.missingSkills = missing;

                let score = 0;
                if (requiredSkills.length > 0) score = Math.round((matched.length / requiredSkills.length) * 100);

                // Experience check (simple numeric/keyword match)
                const reqExp = jobDetails.experience ? String(jobDetails.experience).toLowerCase() : '';
                let hasExp = false;
                if (reqExp) {
                    const expNumMatch = reqExp.match(/(\d+)/);
                    if (expNumMatch) {
                        const years = parseInt(expNumMatch[1], 10);
                        const expRegex = new RegExp(`${years}\\+?\s*years?`, 'i');
                        if (expRegex.test(extractedText)) hasExp = true;
                        else if (textLower.includes(String(years))) hasExp = true;
                    } else if (textLower.includes(reqExp.replace(/years?/gi, '').trim())) {
                        hasExp = true;
                    }
                }
                if (hasExp && score < 100) score = Math.min(100, score + 10);

                // Keyword checks from job description
                const descLower = jobDetails.description ? jobDetails.description.toLowerCase() : '';
                if (descLower.includes('leadership') && !textLower.includes('leadership')) {
                    result.weaknesses.push('Lacks leadership keywords mentioned in JD.');
                }
                if (descLower.includes('agile') && textLower.includes('agile')) {
                    result.strengths.push('Mentions Agile methodology.');
                }

                if (matched.length > 0) result.strengths.push(`Matches ${matched.length} required skills.`);
                if (hasExp) result.strengths.push(`Mentions relevant experience (${jobDetails.experience}).`);
                if (missing.length > 0) result.weaknesses.push(`Missing key skills: ${missing.slice(0,3).join(', ')}`);

                result.matchScore = `${score}%`;
                if (score >= 75) result.recommendation = 'Highly Suitable';
                else if (score >= 40) result.recommendation = 'Moderate Fit';
                else result.recommendation = 'Low Fit';

                return result;
            };

            const merged = (data || []).map(item => {
                const frontend = computeMatch(item.extractedText || '', item.originalFileName || item.candidateName || 'resume');
                return {
                    ...item,
                    ...frontend,
                };
            });

            setResults(merged);
            setShowResults(true);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error('Upload error:', error);
            alert('There was an error uploading files. Check console for details.');
        } finally {
            setIsScreening(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <div className="p-4 md:p-8">
                    
                    {/* Page Header */}
                    <div className="mt-4 md:mt-8 mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                            Resume Screening
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm md:text-base">
                            Upload and analyze candidate resumes
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column (Forms and Upload) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Job Selection */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                <h2 className="font-semibold text-lg text-gray-800 mb-4">
                                    Job Position
                                </h2>
                                <select 
                                    value={selectedJob}
                                    onChange={(e) => setSelectedJob(e.target.value)}
                                    className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all cursor-pointer"
                                >
                                    <option value="" disabled>Select Job Position...</option>
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.id}>{job.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Resume Upload */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                    <h2 className="font-semibold text-lg text-gray-800">
                                        Upload Resumes
                                    </h2>
                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                                        Max upload: 5 PDF files
                                    </span>
                                </div>

                                <div 
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 p-8 md:p-12 rounded-xl text-center transition-all group cursor-pointer flex flex-col items-center justify-center"
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        multiple 
                                        accept="application/pdf"
                                    />
                                    <div className="flex justify-center mb-5">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow transition-all duration-300">
                                            <FaCloudUploadAlt className="text-3xl text-gray-400 group-hover:text-black transition-colors" />
                                        </div>
                                    </div>
                                    <p className="text-gray-800 font-medium mb-1 text-lg">
                                        Drag & drop resumes here
                                    </p>
                                    <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
                                        Supported format: PDF up to 5MB each.
                                    </p>
                                    <button className="bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200">
                                        Choose Files
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Files and Actions) */}
                        <div className="space-y-6">
                            
                            {/* Uploaded files */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md h-full flex flex-col">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="font-semibold text-lg text-gray-800">
                                        Uploaded Files
                                    </h2>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${files.length === 5 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                        {files.length}/5
                                    </span>
                                </div>

                                <div className="space-y-3 flex-1">
                                    {files.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-gray-400">
                                            <p className="text-sm text-center">No files uploaded yet.</p>
                                        </div>
                                    ) : (
                                        files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FaFilePdf className="text-lg" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                    className="text-gray-400 hover:text-red-500 p-2 transition-colors focus:outline-none" 
                                                    aria-label="Remove file"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Action Button */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <button 
                                        onClick={handleStartScreening}
                                        disabled={isScreening || files.length === 0 || !selectedJob}
                                        className={`w-full px-6 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-gray-200 ${
                                            (isScreening || files.length === 0 || !selectedJob) 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' 
                                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg shadow-md'
                                        }`}
                                    >
                                        <FaCheckCircle className="text-sm" />
                                        {isScreening ? 'Processing...' : 'Start Screening'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Result Section */}
                    {showResults && (
                        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 transition-all mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <FaRobot className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">AI Screening Results</h2>
                                    <p className="text-sm text-gray-500">Analysis complete. Here is the preliminary ranking.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {results.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                            <FaRobot className="text-3xl text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-800">No results returned</h3>
                                        <p className="text-sm text-gray-500 max-w-sm mt-2">Try uploading files again or check server logs.</p>
                                    </div>
                                ) : (
                                    results.map((r, idx) => (
                                        <ResultCard key={idx} result={r} rank={idx + 1} totalResults={results.length} />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
