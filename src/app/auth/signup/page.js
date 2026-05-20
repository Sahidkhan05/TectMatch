"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabase";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: { full_name: formData.name }
            }
        });

        if (error) {
            alert(error.message);
            setLoading(false);
            return;
        }

        alert("Signup successful! Please log in.");
        setLoading(false);
        router.push("/auth/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-gray-950 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
                        T
                    </div>
                    <h1 className="text-2xl font-black text-gray-950 tracking-tight">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Join TectMatch to start screening</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    {/* Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <FiUser className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="John Doe"
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <FiMail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="name@company.com"
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <FiLock className="w-5 h-5" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                placeholder="••••••••"
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-8 text-center text-sm font-medium text-gray-600">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}