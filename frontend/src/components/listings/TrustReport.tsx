/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';

interface TrustReportData {
    overallScore: number;
    priceAnalysis: { status: string; listingPrice: number; avgPrice: number; detail: string };
    duplicateAnalysis: { status: string; duplicateCount: number; detail: string };
    textAnalysis: { status: string; patternsFound: string[]; detail: string };
    contactAnalysis: { status: string; detail: string };
    signals: { type: string; severity: string; explanation: string }[];
}

const STATUS_CONFIG = {
    pass: { icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Pass' },
    warn: { icon: '⚠️', color: 'text-amber-600', bg: 'bg-amber-50', label: 'Warning' },
    fail: { icon: '🚨', color: 'text-red-600', bg: 'bg-red-50', label: 'Risk' },
};

const SCORE_BADGE_CLASSES = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
};

function ScoreRing({ score }: { score: number }) {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black" style={{ color }}>{score}</span>
            </div>
        </div>
    );
}

function CheckRow({ label, status, detail }: { label: string; status: string; detail: string }) {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pass;
    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} transition-all`}>
            <span className="text-lg mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                        {config.label}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
            </div>
        </div>
    );
}

export default function TrustReport({ listingId }: { listingId: string }) {
    const [report, setReport] = useState<TrustReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState('');

    const loadReport = async () => {
        setLoading(true);
        setError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/listings/${listingId}/trust-report`);
            if (!res.ok) throw new Error('Failed to load trust report');
            const data = await res.json();
            setReport(data);
            setExpanded(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load on mount lazily
    useEffect(() => {
        // Don't auto-load — let user trigger it
    }, []);

    if (!report && !expanded) {
        return (
            <button
                onClick={loadReport}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Analyzing...
                    </>
                ) : '🛡️ View Trust Report'}
            </button>
        );
    }

    if (error) {
        return <p className="text-sm text-red-500 text-center py-2">{error}</p>;
    }

    if (!report) return null;

    const scoreColor = report.overallScore >= 75 ? 'emerald' : report.overallScore >= 50 ? 'amber' : 'red';
    const scoreBadge = SCORE_BADGE_CLASSES[scoreColor];

    return (
        <div className="rounded-2xl border border-slate-200 overflow-hidden transition-all">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">🛡️</span>
                    <div className="text-left">
                        <span className="font-bold text-sm text-slate-800">Trust Report</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${scoreBadge.bg} ${scoreBadge.text}`}>
                            {report.overallScore}/100
                        </span>
                    </div>
                </div>
                <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
            </button>

            {/* Body */}
            {expanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                    {/* Score Ring */}
                    <div className="flex items-center gap-5 pb-3">
                        <ScoreRing score={report.overallScore} />
                        <div>
                            <p className="font-black text-slate-900">
                                {report.overallScore >= 75 ? 'Looks Trustworthy' :
                                    report.overallScore >= 50 ? 'Proceed with Caution' :
                                        'High Risk — Be Careful'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Based on {report.signals.length === 0 ? 'no' : report.signals.length} risk signal{report.signals.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Check Rows */}
                    <CheckRow label="Price Analysis" status={report.priceAnalysis.status} detail={report.priceAnalysis.detail} />
                    <CheckRow label="Duplicate Check" status={report.duplicateAnalysis.status} detail={report.duplicateAnalysis.detail} />
                    <CheckRow label="Language Analysis" status={report.textAnalysis.status} detail={report.textAnalysis.detail} />
                    <CheckRow label="Contact Quality" status={report.contactAnalysis.status} detail={report.contactAnalysis.detail} />

                    {/* Scam patterns found */}
                    {report.textAnalysis.patternsFound.length > 0 && (
                        <div className="mt-2 p-3 bg-red-50 rounded-xl">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">⚠️ Scam Patterns Detected</p>
                            <ul className="space-y-1">
                                {report.textAnalysis.patternsFound.map((p, i) => (
                                    <li key={i} className="text-xs text-red-700 flex items-center gap-2">
                                        <span>•</span> {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="text-[10px] text-slate-400 text-center pt-2">
                        AI-powered analysis • Price comparison, duplicate detection, NLP scam patterns
                    </p>
                </div>
            )}
        </div>
    );
}
