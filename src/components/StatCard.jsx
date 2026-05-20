import { FiBriefcase, FiFileText, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

export default function StatCard({ title, value, icon, trend, trendLabel }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors">{value}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl text-gray-600 group-hover:bg-gray-100 group-hover:scale-105 transition-all">
                    {icon || <FiBriefcase />}
                </div>
            </div>
            
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'} bg-${trend > 0 ? 'emerald' : 'red'}-50 px-2 py-0.5 rounded-md`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-gray-400 ml-2">{trendLabel || 'vs last month'}</span>
                </div>
            )}
        </div>
    );
}