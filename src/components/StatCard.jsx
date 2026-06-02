import { FiBriefcase, FiFileText, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

export default function StatCard({ title, value, icon, trend, trendLabel }) {
    return (
        <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group h-full">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2">{title}</p>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 group-hover:text-black transition-colors break-words">
                        {value}
                    </h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-50 flex items-center justify-center text-lg sm:text-xl text-gray-600 group-hover:bg-gray-100 group-hover:scale-105 transition-all flex-shrink-0 shadow-sm">
                    {icon || <FiBriefcase />}
                </div>
            </div>
            
            {trend !== undefined && trend !== null && (
                <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm gap-2 flex-wrap">
                    <span className={`font-semibold px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        trend > 0 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : trend < 0 
                            ? 'text-red-600 bg-red-50'
                            : 'text-gray-600 bg-gray-100'
                    }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-gray-400 text-xs sm:text-sm">{trendLabel || 'vs last month'}</span>
                </div>
            )}
        </div>
    );
}