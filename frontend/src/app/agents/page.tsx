'use client';

import React from 'react';
import Link from 'next/link';

const agents = [
    {
        name: 'Sentinel',
        emoji: '🛰️',
        role: 'Listing Scanner',
        status: 'Active',
        description:
            'Sentinel continuously scans major German housing portals — WG-Gesucht, ImmoScout24, Immowelt, and Kleinanzeigen — to find new listings as they appear.',
        capabilities: [
            'Multi-platform scraping (4 portals)',
            'Scheduled scans every hour',
            'Automatic duplicate detection & merging',
            'New listing alerts (coming soon)',
        ],
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        textColor: 'text-blue-700',
    },
    {
        name: 'Hawk',
        emoji: '🦅',
        role: 'Scam Detector',
        status: 'Active',
        description:
            'Hawk analyzes every listing for scam indicators — suspicious pricing, fake images, known fraud patterns — and assigns a trust score from 0 to 100.',
        capabilities: [
            'AI-powered scam detection',
            'Trust score calculation (0–100)',
            'Price anomaly detection',
            'Landlord verification checks',
        ],
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        textColor: 'text-amber-700',
    },
    {
        name: 'Diplomat',
        emoji: '🤝',
        role: 'Auto-Applicant',
        status: 'Active',
        description:
            'Diplomat writes personalized, professional rental application messages on your behalf using AI, tailored to each listing and your profile.',
        capabilities: [
            'AI-generated personalized applications',
            'Profile-aware messaging (income, job, intro)',
            'Automatic email dispatch to landlords',
            'Application tracking & status',
        ],
        color: 'from-teal-500 to-emerald-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-100',
        textColor: 'text-teal-700',
    },
];

export default function AgentsPage() {
    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black tracking-widest">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                        </span>
                        ALL AGENTS ONLINE
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Meet the{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">
                            Agents
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                        Three AI-powered agents work around the clock to find, verify, and
                        apply to apartments on your behalf.
                    </p>
                </div>

                {/* Agent Cards */}
                <div className="space-y-8">
                    {agents.map((agent) => (
                        <div
                            key={agent.name}
                            className="glass-card rounded-3xl p-8 md:p-10 transition-all duration-300 hover:shadow-xl"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Left: Info */}
                                <div className="flex-grow space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl">{agent.emoji}</span>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">
                                                {agent.name}
                                            </h2>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                                {agent.role}
                                            </p>
                                        </div>
                                        <span
                                            className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${agent.bgColor} ${agent.borderColor} border ${agent.textColor}`}
                                        >
                                            {agent.status}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 leading-relaxed font-medium">
                                        {agent.description}
                                    </p>

                                    {/* Capabilities */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {agent.capabilities.map((cap, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 text-sm text-slate-700 font-medium"
                                            >
                                                <svg
                                                    className={`w-4 h-4 ${agent.textColor} flex-shrink-0`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                {cap}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16 space-y-4">
                    <p className="text-slate-500 font-medium">
                        Ready to put the agents to work?
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/search"
                            className="btn-primary !px-8 !py-4 uppercase tracking-widest text-xs font-black"
                        >
                            Start Searching
                        </Link>
                        <Link
                            href="/register"
                            className="btn-ghost !px-8 !py-4 uppercase tracking-widest text-xs font-black"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
