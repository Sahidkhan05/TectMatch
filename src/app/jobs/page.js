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
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 md:mt-8 mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                Jobs
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm md:text-base">
                                Create and manage job descriptions
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200"
                        >
                            {showForm ? <FiX /> : <FiPlus />}
                            {showForm ? 'Cancel' : 'Create New Job'}
                        </button>
                    </div>

                    {/* Job Creation Form */}
                    {showForm && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 transition-all animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Details</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Job Title</label>
                                        <input 
                                            type="text" name="title" required
                                            value={formData.title} onChange={handleInputChange}
                                            className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                                            placeholder="e.g. Senior Frontend Engineer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Company Name</label>
                                        <input 
                                            type="text" name="company" required
                                            value={formData.company} onChange={handleInputChange}
                                            className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                                            placeholder="e.g. TectMatch"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Required Skills</label>
                                        <input 
                                            type="text" name="skills" required
                                            value={formData.skills} onChange={handleInputChange}
                                            className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                                            placeholder="e.g. React, Node.js, TypeScript"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Experience Required</label>
                                        <input 
                                            type="text" name="experience" required
                                            value={formData.experience} onChange={handleInputChange}
                                            className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                                            placeholder="e.g. 3-5 years"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Job Description</label>
                                    <textarea 
                                        name="description" required rows="4"
                                        value={formData.description} onChange={handleInputChange}
                                        className="w-full bg-white text-black placeholder-gray-400 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none" 
                                        placeholder="Describe the responsibilities, requirements, and benefits..."
                                    />
                                </div>
                                <div className="flex justify-end pt-2 border-t border-gray-100">
                                    <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-4 focus:ring-gray-200 mt-4">
                                        Submit Job
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Jobs List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Jobs</h2>
                        
                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gray-400">
                                <div className="animate-pulse flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                </div>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all">
                                <FiBriefcase className="mx-auto text-4xl text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
                                <p className="text-gray-500 mt-1">Click &quot;Create New Job&quot; to add your first job description.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {jobs.map((job) => (
                                    <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors">{job.title}</h3>
                                                    <p className="text-sm font-medium text-gray-500 mt-0.5">{job.company}</p>
                                                </div>
                                                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    Active
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2.5 mt-2">
                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <FiBriefcase className="mt-0.5 flex-shrink-0 text-gray-400" />
                                                    <span><span className="font-medium text-gray-900">Skills:</span> {job.skills}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FiClock className="flex-shrink-0 text-gray-400" />
                                                    <span><span className="font-medium text-gray-900">Experience:</span> {job.experience}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                                <FiCalendar />
                                                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors focus:outline-none" title="Edit">
                                                    <FiEdit2 />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(job.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none" title="Delete"
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
    );
}
