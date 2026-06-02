"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiHome, FiBriefcase, FiFileText, FiUser, FiLogOut, FiMoreVertical, FiMenu, FiX } from "react-icons/fi";
import supabase from "../lib/supabase";
import { useState } from "react";

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
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/auth/login");
    };

    const closeMobileMenu = () => {
        setIsOpen(false);
    };

    const sidebarContent = (
        <>
            {/* Top Section */}
            <div className="flex-1">
                {/* Logo Section */}
                <div className={`p-4 sm:p-5 md:p-6 flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}>
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                        T
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight hidden md:block">
                            TectMatch
                        </h1>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className={`px-3 sm:px-4 md:px-4 mt-4 space-y-1 ${isCollapsed ? 'md:px-2' : ''}`}>
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link key={index} href={item.path} onClick={closeMobileMenu}>
                                <div className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer transition-all duration-300 mb-1 ${
                                    isCollapsed ? 'md:justify-center md:px-3' : ''
                                } ${
                                    isActive 
                                        ? "bg-black text-white shadow-md shadow-gray-200/50" 
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}>
                                    <span className={`text-lg sm:text-xl ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"}`}>
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="font-medium text-sm hidden md:inline">
                                            {item.name}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section - HR Profile Card & Logout */}
            <div className={`p-3 sm:p-4 md:p-4 border-t border-gray-100 bg-gray-50/30 ${isCollapsed ? 'md:px-2' : ''}`}>
                <div className="flex flex-col gap-2">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group border border-transparent hover:border-gray-200 hidden md:flex">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 shadow-inner text-xs sm:text-sm">
                                HA
                            </div>
                            <div className="overflow-hidden flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">HR Admin</p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">admin@tectmatch.com</p>
                            </div>
                            <FiMoreVertical className="text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0" />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleLogout}
                        className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors cursor-pointer w-full text-left ${isCollapsed ? 'md:justify-center md:p-3' : ''}`}
                    >
                        <span className="text-lg sm:text-xl flex-shrink-0">
                            <FiLogOut />
                        </span>
                        {!isCollapsed && (
                            <span className="font-medium text-sm hidden md:inline">
                                Logout
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        T
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">TectMatch</h1>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                >
                    {isOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-col w-64 h-screen bg-white border-r border-gray-100 sticky top-0 shadow-sm z-50 transition-all duration-300">
                {sidebarContent}
            </div>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 shadow-lg z-30 transform transition-transform duration-300 ease-in-out md:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="h-screen flex flex-col overflow-y-auto">
                    {sidebarContent}
                </div>
            </div>

            {/* Toggle Button for Desktop Collapse (optional - uncomment if needed) */}
            {/* 
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute top-6 -right-12 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
            >
                {isCollapsed ? <FiMenu /> : <FiX />}
            </button>
            */}
        </>
    );
}