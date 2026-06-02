"use client";
import Sidebar from "../../components/Sidebar";
import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../../lib/supabase";
import { FaCloudUploadAlt, FaFilePdf, FaTrash, FaCheckCircle, FaUserTie } from "react-icons/fa";
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

    const removeFile = useCallback((indexToRemove) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    }, []);

    const handleStartScreening = async () => {
        if (!selectedJob) {
            alert("Please select a job position first.");
            return;
        }
        if (files.length === 0) {
            alert("Please upload at least one resume.");
            return;
        }
        setIsScreening(true);

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
            setResults(data || []);
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
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full overflow-x-hidden">
                <main className="flex-1 overflow-y-auto">
                    <div className="page-padding">
                        {/* Page Header */}
                        <div className="mt-4 sm:mt-6 md:mt-8 mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                Resume Screening
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg leading-relaxed">
                                Upload and analyze candidate resumes
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 card-spacing">
                            {/* Left Column (Forms and Upload) */}
                            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                                {/* Job Selection */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
                                    <h2 className="font-semibold text-base sm:text-lg md:text-xl text-gray-800 mb-4">
                                        Job Position
                                    </h2>
                                    <select 
                                        value={selectedJob}
                                        onChange={(e) => setSelectedJob(e.target.value)}
                                        className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all cursor-pointer text-sm sm:text-base touch-target"
                                    >
                                        <option value="" disabled>Select Job Position...</option>
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>{job.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Resume Upload */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 transition-all hover:shadow-md">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                        <h2 className="font-semibold text-base sm:text-lg md:text-xl text-gray-800">
                                            Upload Resumes
                                        </h2>
                                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                                            Max: 5 files
                                        </span>
                                    </div>

                                    <div 
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 p-6 sm:p-8 md:p-12 rounded-xl text-center transition-all group cursor-pointer flex flex-col items-center justify-center"
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            multiple 
                                            accept="application/pdf"
                                        />
                                        <div className="flex justify-center mb-4 sm:mb-5">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow transition-all duration-300">
                                                <FaCloudUploadAlt className="text-2xl sm:text-3xl text-gray-400 group-hover:text-black transition-colors" />
                                            </div>
                                        </div>
                                        <p className="text-gray-800 font-medium mb-1 text-base sm:text-lg">
                                            Drag & drop resumes
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 max-w-xs mx-auto">
                                            Supported format: PDF up to 5MB each.
                                        </p>
                                        <button className="bg-black text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200 text-sm sm:text-base touch-target">
                                            Choose Files
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Files and Actions) */}
                            <div className="space-y-4 sm:space-y-6">
                                {/* Uploaded files */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 transition-all hover:shadow-md flex flex-col">
                                    <div className="flex justify-between items-center gap-2 mb-4 sm:mb-5">
                                        <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                                            Files
                                        </h2>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors flex-shrink-0 ${files.length === 5 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                            {files.length}/5
                                        </span>
                                    </div>

                                    <div className="space-y-2 sm:space-y-3 flex-1 min-h-[100px]">
                                        {files.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                                                <p className="text-xs sm:text-sm text-center">No files uploaded yet.</p>
                                            </div>
                                        ) : (
                                            files.map((file, index) => (
                                                <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between p-2 sm:p-3 border border-gray-100 rounded-lg sm:rounded-xl bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group">
                                                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                                                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0 text-sm sm:text-base">
                                                            <FaFilePdf />
                                                        </div>
                                                        <div className="truncate min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                        className="text-gray-400 hover:text-red-500 p-1.5 sm:p-2 transition-colors focus:outline-none flex-shrink-0" 
                                                        aria-label="Remove file"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                                        <button 
                                            onClick={handleStartScreening}
                                            disabled={isScreening || files.length === 0 || !selectedJob}
                                            className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-gray-200 text-sm sm:text-base touch-target ${
                                                (isScreening || files.length === 0 || !selectedJob) 
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' 
                                                    : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg shadow-md'
                                            }`}
                                        >
                                            <FaCheckCircle className="text-sm flex-shrink-0" />
                                            <span>{isScreening ? 'Processing...' : 'Start Screening'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        {showResults && (
                            <div className="mt-6 sm:mt-8 md:mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 md:p-8 animate-in-smooth mb-6 sm:mb-8">
                                <div className="flex items-center gap-2 sm:gap-3 mb-6">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm sm:text-base">
                                        <FaUserTie className="text-lg sm:text-xl" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Candidate Workspace</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Analysis complete. Review candidate matches and take action.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    {results.length === 0 ? (
                                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 sm:mb-4">
                                                <FaRobot className="text-2xl sm:text-3xl text-gray-300" />
                                            </div>
                                            <h3 className="text-base sm:text-lg font-medium text-gray-800">No results returned</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-2">Try uploading files again or check server logs.</p>
                                        </div>
                                    ) : (
                                        results.map((r, idx) => (
                                            <ResultCard key={r.originalFileName || r.candidateName || idx} result={r} rank={idx + 1} totalResults={results.length} />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
