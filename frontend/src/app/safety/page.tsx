'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getListingStats } from '@/lib/api';

interface PlatformStat {
    platform: string;
    count: number;
    avgTrust: number;
}

interface ScamListing {
    id: string;
    title: string;
    priceWarm: number;
    locationName: string;
    trustScore: number;
    scamIndicators: { type: string; severity: string; explanation: string }[];
    platform: string;
    createdAt: string;
}

interface Stats {
    total: number;
    activeCount: number;
    scamCount: number;
    averageTrustScore: number;
    platformStats: PlatformStat[];
    recentScams: ScamListing[];
}

const INDICATOR_LABELS: Record<string, { label: string; icon: string }> = {
    price_anomaly: { label: 'Price Anomaly', icon: '💰' },
    fake_images: { label: 'Fake Images', icon: '🖼️' },
    missing_address: { label: 'Missing Address', icon: '📍' },
    upfront_payment: { label: 'Upfront Payment', icon: '💸' },
    suspicious_contact: { label: 'Suspicious Contact', icon: '📞' },
    too_good: { label: 'Too Good to Be True', icon: '✨' },
    vague_description: { label: 'Vague Description', icon: '📝' },
    foreign_payment: { label: 'Foreign Payment', icon: '🌍' },
    pressure_tactics: { label: 'Pressure Tactics', icon: '⏰' },
    no_viewing: { label: 'No Viewing Offered', icon: '🚫' },
};

function getTrustColor(score: number) {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
}

function getTrustBg(score: number) {
    if (score >= 80) return 'bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'bg-amber-50 border-amber-100';
    if (score >= 40) return 'bg-orange-50 border-orange-100';
    return 'bg-red-50 border-red-100';
}

function getSeverityColor(severity: string) {
    if (severity === 'high') return 'bg-red-100 text-red-700';
    if (severity === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
}

export default function SafetyPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getListingStats()
            .then(setStats)
            .catch((err) => console.error('Failed to load stats:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen pt-28 pb-16 px-4 text-center">
                <p className="text-slate-600">Failed to load safety data.</p>
            </div>
        );
    }

    const scamRate = stats.total > 0 ? ((stats.scamCount / stats.total) * 100).toFixed(1) : '0';

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black tracking-widest">
                        🦅 HAWK AGENT — SCAM DETECTION
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Safety{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                            Dashboard
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                        Real-time scam intelligence from our Hawk agent. Every listing is analyzed for fraud
                        indicators before it reaches you.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Scanned</p>
                    </div>
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <p className="text-3xl font-black text-emerald-600">{stats.activeCount}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Active & Safe</p>
                    </div>
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <p className="text-3xl font-black text-red-600">{stats.scamCount}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Scams Flagged</p>
                    </div>
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <p className={`text-3xl font-black ${getTrustColor(stats.averageTrustScore)}`}>
                            {stats.averageTrustScore}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Avg Trust Score</p>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="glass-card rounded-3xl p-8 mb-8">
                    <h2 className="text-xl font-black text-slate-900 mb-6">Platform Trust Scores</h2>
                    <div className="space-y-4">
                        {stats.platformStats.map((p) => (
                            <div key={p.platform} className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-700 w-32">{p.platform}</span>
                                <div className="flex-grow h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${p.avgTrust >= 80
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                : p.avgTrust >= 60
                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                                            }`}
                                        style={{ width: `${p.avgTrust}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-black w-12 text-right ${getTrustColor(p.avgTrust)}`}>
                                    {p.avgTrust}
                                </span>
                                <span className="text-xs text-slate-400 font-medium w-20 text-right">
                                    {p.count} listings
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scam Detection Rate */}
                <div className="glass-card rounded-3xl p-8 mb-8">
                    <h2 className="text-xl font-black text-slate-900 mb-4">Detection Rate</h2>
                    <p className="text-slate-600 font-medium">
                        Of {stats.total} listings scanned, <strong className="text-red-600">{scamRate}%</strong> were
                        flagged as potential scams. Our Hawk agent analyzes pricing patterns, listing descriptions,
                        contact details, and image authenticity to protect you.
                    </p>
                </div>

                {/* Recently Flagged */}
                {stats.recentScams.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-slate-900">Recently Flagged Listings</h2>
                        {stats.recentScams.map((scam) => (
                            <div
                                key={scam.id}
                                className={`glass-card rounded-2xl p-6 border-l-4 border-l-red-400`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <Link
                                            href={`/listings/${scam.id}`}
                                            className="font-bold text-slate-900 hover:text-teal-600 transition-colors"
                                        >
                                            {scam.title}
                                        </Link>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span>{scam.locationName}</span>
                                            <span>•</span>
                                            <span>€{Math.round(scam.priceWarm)}/mo</span>
                                            <span>•</span>
                                            <span>{scam.platform}</span>
                                        </div>
                                        {/* Scam Indicators */}
                                        {scam.scamIndicators && scam.scamIndicators.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {scam.scamIndicators.map((ind, idx) => {
                                                    const info = INDICATOR_LABELS[ind.type] || { label: ind.type, icon: '⚠️' };
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getSeverityColor(ind.severity)}`}
                                                            title={ind.explanation}
                                                        >
                                                            {info.icon} {info.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full border text-sm font-black ${getTrustBg(scam.trustScore)} ${getTrustColor(scam.trustScore)}`}>
                                        {scam.trustScore}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips */}
                <div className="mt-12 glass-card rounded-3xl p-8 space-y-4">
                    <h2 className="text-xl font-black text-slate-900">🛡️ Stay Safe — Common Scam Red Flags</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: '💸', text: 'Never pay deposit or rent before visiting the apartment in person' },
                            { icon: '📍', text: 'Listings without a specific address are more likely to be fake' },
                            { icon: '💰', text: 'Prices significantly below market average are a major red flag' },
                            { icon: '🌍', text: 'Landlords asking for payment via Western Union or crypto are scams' },
                            { icon: '⏰', text: 'High-pressure tactics like "pay today or lose it" are suspicious' },
                            { icon: '🖼️', text: 'Reverse-image search listing photos to check for stock images' },
                        ].map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <span className="text-xl">{tip.icon}</span>
                                <p className="text-sm text-slate-600 font-medium">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
