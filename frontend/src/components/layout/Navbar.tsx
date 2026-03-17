"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-3 rounded-2xl">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black transition-transform group-hover:scale-110">
                        H
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        Housing<span className="text-teal-600">DE</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
                    <Link href="/search" className="hover:text-teal-600 transition-colors">Find Homes</Link>
                    <Link href="/verify" className="hover:text-teal-600 transition-colors">Get Verified</Link>
                    <Link href="/vault" className="hover:text-teal-600 transition-colors">Vault</Link>
                    <Link href="/agents" className="hover:text-teal-600 transition-colors">Meet the Agents</Link>
                    <Link href="/pricing" className="hover:text-teal-600 transition-colors">Pricing</Link>
                    <Link href="/safety" className="hover:text-teal-600 transition-colors">Safety</Link>
                    <Link href="/alerts" className="text-slate-400 hover:text-teal-600 transition-colors" title="Alerts">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </Link>
                </div>

                {/* Auth Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-slate-500">
                                Hi, {user.firstName || user.email.split('@')[0]}
                            </span>
                            <Link href="/profile" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                My Profile
                            </Link>
                            <Link href="/applications" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                My Applications
                            </Link>
                            {user.role === 'admin' && (
                                <Link href="/admin" className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                                    Admin
                                </Link>
                            )}
                            <Link href="/watchlist" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                Watchlist
                            </Link>
                            <button
                                onClick={logout}
                                className="btn-ghost !py-2 !px-5 text-sm !border-teal-100 text-teal-700 hover:bg-teal-50"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors">Sign In</Link>
                            <Link href="/register" className="btn-primary !py-2 !px-5 text-sm">Join Platform</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
