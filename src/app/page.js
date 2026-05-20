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
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-4 md:p-8">



          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-8 mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 mt-2 text-sm md:text-base">
                Welcome back! Here's what's happening with your recruitment today.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link href="/resume-screening">
                <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  <FiFileText />
                  Screen Resumes
                </button>
              </Link>
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
                <FiBarChart2 />
                View Analysis
              </button>
              <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm">
                <FiPlus />
                Create Job
              </button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart / Analytics Placeholder */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-lg text-gray-800">Hiring Progress & Analytics</h2>
                <button className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1">
                  This Week <FiArrowRight />
                </button>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                <FiBarChart2 className="text-4xl mb-3 opacity-50" />
                <p className="font-medium text-gray-500">Analytics Chart Placeholder</p>
                <p className="text-sm mt-1">Hiring funnel visualization will appear here</p>
              </div>
            </div>

            {/* Candidate Statistics & Activity */}
            <div className="space-y-6">
              {/* Candidate Stats Mini-Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <FiUsers className="text-gray-400" />
                  Candidate Pipeline
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Screening</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Interviewing</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Offered</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <FiActivity className="text-gray-400" />
                  Recent Activity
                </h2>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent hidden">
                  {/* Note: Kept simplified layout for clean SaaS look rather than complex timeline */}
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.target} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Uploaded Resumes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-800">Recent Resumes</h2>
              <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-500">
                    <th className="pb-3 font-medium">Candidate Name</th>
                    <th className="pb-3 font-medium">Applied Role</th>
                    <th className="pb-3 font-medium">Date Uploaded</th>
                    <th className="pb-3 font-medium">Match Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentResumes.map((resume, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs">
                          {resume.name.charAt(0)}
                        </div>
                        {resume.name}
                      </td>
                      <td className="py-4 text-gray-600">{resume.role}</td>
                      <td className="py-4 text-gray-500">{resume.date}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resume.statusColor}`}>
                          {resume.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-gray-400 hover:text-black font-medium transition-colors opacity-0 group-hover:opacity-100">
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
      </div>
    </div>
  );
}