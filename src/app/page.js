import Sidebar from "../components/Sidebar";

import StatCard from "../components/StatCard";
import Link from "next/link";
import { FiBriefcase, FiFileText, FiCheckCircle, FiTrendingUp, FiPlus, FiArrowRight, FiActivity, FiUsers, FiBarChart2 } from "react-icons/fi";

export default function Home() {
  const dashboardData = [
    { title: "Total Jobs", value: "12", icon: <FiBriefcase />, trend: 8, trendLabel: "from last month" },
    { title: "Total Resumes", value: "148", icon: <FiFileText />, trend: 24, trendLabel: "new this week" },
    { title: "Selected Candidates", value: "24", icon: <FiCheckCircle />, trend: 12, trendLabel: "vs last month" },
    { title: "Average Match Rate", value: "85%", icon: <FiTrendingUp />, trend: 4, trendLabel: "overall improvement" },
  ];

  const recentResumes = [
    { name: "Sarah Jenkins", role: "Frontend Developer", date: "2 hours ago", status: "High Match", statusColor: "text-emerald-600 bg-emerald-50" },
    { name: "Michael Chen", role: "Backend Developer", date: "4 hours ago", status: "Review", statusColor: "text-amber-600 bg-amber-50" },
    { name: "Emily Rodriguez", role: "UI/UX Designer", date: "5 hours ago", status: "High Match", statusColor: "text-emerald-600 bg-emerald-50" },
    { name: "David Kim", role: "MERN Stack Developer", date: "1 day ago", status: "Low Match", statusColor: "text-red-600 bg-red-50" },
  ];

  const recentActivity = [
    { action: "Screening completed", target: "Frontend Developer batch", time: "10 mins ago" },
    { action: "New job created", target: "Senior Product Designer", time: "2 hours ago" },
    { action: "Candidate selected", target: "Sarah Jenkins", time: "4 hours ago" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
      {/* Sidebar - Visible on desktop, drawer on mobile */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-x-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="page-padding">
            {/* Page Header */}
            <div className="mt-4 sm:mt-6 md:mt-8 mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg leading-relaxed">
                Welcome back! Here&apos;s what&apos;s happening with your recruitment today.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 w-full">
              <Link href="/resume-screening" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm sm:text-base touch-target">
                  <FiFileText className="flex-shrink-0" />
                  <span>Screen Resumes</span>
                </button>
              </Link>
              <button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm sm:text-base touch-target">
                <FiBarChart2 className="flex-shrink-0" />
                <span>View Analysis</span>
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-black text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm sm:text-base touch-target">
                <FiPlus className="flex-shrink-0" />
                <span>Create Job</span>
              </button>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 card-spacing mb-6 sm:mb-8">
              {dashboardData.map((item, index) => (
                <StatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  trend={item.trend}
                  trendLabel={item.trendLabel}
                />
              ))}
            </div>

            {/* Analytics and Pipeline Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 card-spacing mb-6 sm:mb-8">
              {/* Chart / Analytics */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <h2 className="font-semibold text-base sm:text-lg md:text-xl text-gray-800">Hiring Progress & Analytics</h2>
                  <button className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap">
                    This Week <FiArrowRight className="text-sm" />
                  </button>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] text-gray-400 p-4">
                  <FiBarChart2 className="text-3xl sm:text-4xl mb-3 opacity-50" />
                  <p className="font-medium text-gray-500 text-center text-sm sm:text-base">Analytics Chart Placeholder</p>
                  <p className="text-xs sm:text-sm mt-1 text-center text-gray-400">Hiring funnel visualization will appear here</p>
                </div>
              </div>

              {/* Candidate Statistics & Activity Column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Candidate Stats Mini-Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h2 className="font-semibold text-base sm:text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <FiUsers className="text-gray-400 flex-shrink-0" />
                    <span>Candidate Pipeline</span>
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { label: "Screening", percent: 45, color: "bg-blue-500" },
                      { label: "Interviewing", percent: 30, color: "bg-amber-500" },
                      { label: "Offered", percent: 25, color: "bg-emerald-500" }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-gray-800">{item.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
                          <div className={`${item.color} h-2 sm:h-2.5 rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h2 className="font-semibold text-base sm:text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <FiActivity className="text-gray-400 flex-shrink-0" />
                    <span>Recent Activity</span>
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex gap-3 sm:gap-4 items-start">
                        <div className="w-2 h-2 rounded-full bg-black mt-1.5 sm:mt-2 flex-shrink-0 min-w-2"></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-800">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{activity.target} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Resumes Table - Responsive */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <h2 className="font-semibold text-base sm:text-lg md:text-xl text-gray-800">Recent Resumes</h2>
                <button className="text-xs sm:text-sm font-medium text-gray-500 hover:text-black transition-colors whitespace-nowrap">
                  View All
                </button>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3">
                {recentResumes.map((resume, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50/30">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                        {resume.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resume.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{resume.role}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-400">{resume.date}</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resume.statusColor}`}>
                        {resume.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 font-medium text-gray-500 text-xs sm:text-sm">Candidate Name</th>
                      <th className="pb-3 font-medium text-gray-500 text-xs sm:text-sm">Applied Role</th>
                      <th className="pb-3 font-medium text-gray-500 text-xs sm:text-sm">Date Uploaded</th>
                      <th className="pb-3 font-medium text-gray-500 text-xs sm:text-sm">Match Status</th>
                      <th className="pb-3 font-medium text-gray-500 text-xs sm:text-sm text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResumes.map((resume, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 font-medium text-gray-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                            {resume.name.charAt(0)}
                          </div>
                          <span className="truncate">{resume.name}</span>
                        </td>
                        <td className="py-4 text-gray-600 text-sm">{resume.role}</td>
                        <td className="py-4 text-gray-500 text-sm">{resume.date}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resume.statusColor}`}>
                            {resume.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-gray-400 hover:text-black font-medium transition-colors opacity-0 group-hover:opacity-100 text-sm">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
