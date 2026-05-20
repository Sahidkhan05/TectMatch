"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiHome, FiBriefcase, FiFileText, FiUser, FiLogOut, FiMoreVertical } from "react-icons/fi";
import supabase from "../lib/supabase";

const menuItems = [
    {
        name: "Dashboard",
        path: "/",
        icon: <FiHome />,
    },
    {
        name: "Jobs",
        path: "/jobs",
        icon: <FiBriefcase />,
    },
    {
        name: "Resume Screening",
        path: "/resume-screening",
        icon: <FiFileText />,
    },
    {
        name: "Profile",
        path: "/profile",
        icon: <FiUser />,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/auth/login");
    };

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col justify-between sticky top-0 shadow-sm z-50">
            {/* Top Section */}
            <div>
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                        T
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        TectMatch
                    </h1>
                </div>

                {/* Navigation Menu */}
                <nav className="px-4 mt-4 space-y-1">
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link key={index} href={item.path}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 mb-1 ${
                                    isActive 
                                        ? "bg-black text-white shadow-md shadow-gray-200/50" 
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}>
                                    <span className={`text-xl ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-medium text-sm">
                                        {item.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section - HR Profile Card & Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group border border-transparent hover:border-gray-200">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 shadow-inner">
                            HA
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">HR Admin</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">admin@tectmatch.com</p>
                        </div>
                        <FiMoreVertical className="text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0" />
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors cursor-pointer w-full text-left"
                    >
                        <span className="text-xl">
                            <FiLogOut />
                        </span>
                        <span className="font-medium text-sm">
                            Logout
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}