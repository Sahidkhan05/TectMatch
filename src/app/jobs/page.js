"use client";
import Sidebar from "../../components/Sidebar";
import { useCallback, useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiClock, FiCalendar, FiX } from "react-icons/fi";

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        skills: '',
        experience: '',
        description: ''
    });

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('tectmatch_jobs').select('*').order('created_at', { ascending: false });
            
            if (error) throw error;
            if (data) setJobs(data);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            // Fallback for demonstration if Supabase is not configured
            setJobs([
                {
                    id: '1',
                    title: 'Frontend Developer',
                    company: 'TectMatch',
                    skills: 'React, Next.js, Tailwind CSS',
                    experience: '3-5 years',
                    created_at: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'Backend Engineer',
                    company: 'TectMatch',
                    skills: 'Node.js, Express, PostgreSQL',
                    experience: '5+ years',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchJobs();
    }, [fetchJobs]);

    const handleInputChange = (e) => {
        setFormData(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.from('tectmatch_jobs').insert([formData]).select();
            
            if (error) throw error;
            
            if (data) {
                setJobs(prevJobs => [data[0], ...prevJobs]);
            }
            
            setShowForm(false);
            setFormData({ title: '', company: '', skills: '', experience: '', description: '' });
        } catch (error) {
            console.error("Error creating job:", error);
            // Fallback UI update if DB is unavailable
            const newJob = { ...formData, id: Date.now().toString(), created_at: new Date().toISOString() };
            setJobs(prevJobs => [newJob, ...prevJobs]);
            setShowForm(false);
            setFormData({ title: '', company: '', skills: '', experience: '', description: '' });
            alert("Note: Job added locally for testing. Supabase connection failed. Please configure your .env.local file with Supabase credentials and create a 'jobs' table.");
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from('tectmatch_jobs').delete().eq('id', id);
            if (error) throw error;
            setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
        } catch (error) {
            console.error("Error deleting job:", error);
            // Fallback for local UI updates
            setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <div className="p-4 md:p-8">
                    <div className="page-padding">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-6 md:mt-8 mb-6 sm:mb-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                    Jobs
                                </h1>
                                <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg leading-relaxed">
                                    Create and manage job descriptions
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 bg-black text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200 text-sm sm:text-base touch-target whitespace-nowrap"
                            >
                                {showForm ? <FiX /> : <FiPlus />}
                                <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Create New Job'}</span>
                                <span className="sm:hidden">{showForm ? 'Cancel' : 'New Job'}</span>
                            </button>
                        </div>

                        {/* Job Creation Form */}
                        {showForm && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 lg:p-8 mb-6 sm:mb-8 transition-all animate-in-smooth">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Job Details</h2>
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm font-medium text-gray-700">Job Title</label>
                                            <input 
                                                type="text" name="title" required
                                                value={formData.title} onChange={handleInputChange}
                                                className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base touch-target" 
                                                placeholder="e.g. Senior Frontend Engineer"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm font-medium text-gray-700">Company Name</label>
                                            <input 
                                                type="text" name="company" required
                                                value={formData.company} onChange={handleInputChange}
                                                className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base touch-target" 
                                                placeholder="e.g. TectMatch"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm font-medium text-gray-700">Required Skills</label>
                                            <input 
                                                type="text" name="skills" required
                                                value={formData.skills} onChange={handleInputChange}
                                                className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base touch-target" 
                                                placeholder="e.g. React, Node.js, TypeScript"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm font-medium text-gray-700">Experience Required</label>
                                            <input 
                                                type="text" name="experience" required
                                                value={formData.experience} onChange={handleInputChange}
                                                className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base touch-target" 
                                                placeholder="e.g. 3-5 years"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-medium text-gray-700">Job Description</label>
                                        <textarea 
                                            name="description" required rows="4"
                                            value={formData.description} onChange={handleInputChange}
                                            className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none text-sm sm:text-base touch-target" 
                                            placeholder="Describe the responsibilities, requirements, and benefits..."
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-gray-100">
                                        <button type="submit" className="bg-black text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200 mt-4 text-sm sm:text-base touch-target">
                                            Submit Job
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Jobs List */}
                        <div className="space-y-4">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">Active Jobs</h2>
                            
                            {loading ? (
                                <div className="flex justify-center items-center py-16 sm:py-20 text-gray-400">
                                    <div className="animate-pulse flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    </div>
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all">
                                    <FiBriefcase className="mx-auto text-3xl sm:text-4xl text-gray-300 mb-3" />
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900">No jobs posted yet</h3>
                                    <p className="text-gray-500 mt-1 text-sm sm:text-base">Click &quot;Create New Job&quot; to add your first job description.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 card-spacing">
                                    {jobs.map((job) => (
                                        <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2 mb-4 sm:mb-5">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 group-hover:text-black transition-colors truncate">{job.title}</h3>
                                                        <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 truncate">{job.company}</p>
                                                    </div>
                                                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                                        Active
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 sm:space-y-2.5 mt-2">
                                                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                                                        <FiBriefcase className="mt-0.5 flex-shrink-0 text-gray-400 text-sm sm:text-base" />
                                                        <span className="break-words"><span className="font-medium text-gray-900">Skills:</span> {job.skills}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                                                        <FiClock className="mt-0.5 flex-shrink-0 text-gray-400 text-sm sm:text-base" />
                                                        <span className="break-words"><span className="font-medium text-gray-900">Experience:</span> {job.experience}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium min-w-0">
                                                    <FiCalendar className="flex-shrink-0" />
                                                    <span className="truncate">{new Date(job.created_at).toLocaleDateString()}</span>
                                                </div>
                                                
                                                <div className="flex gap-1.5 flex-shrink-0">
                                                    <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors focus:outline-none text-sm sm:text-base touch-target" title="Edit">
                                                        <FiEdit2 />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(job.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none text-sm sm:text-base touch-target" title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
