'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/services/api.client';
import { useAuth } from '@/context/AuthContext';

interface Application {
    id: string;
    listingId: string;
    status: string;
    letterContent: string;
    sentAt: string;
    createdAt: string;
    notes?: string;
    listing: {
        title: string;
        priceWarm: number;
        locationName: string;
        images: string[];
    };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    generated: { label: 'Generated', color: 'text-slate-600', bg: 'bg-slate-100' },
    sent: { label: 'Sent', color: 'text-blue-600', bg: 'bg-blue-50' },
    viewed: { label: 'Viewed', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    responded: { label: 'Responded', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    viewing_scheduled: { label: 'Viewing Set', color: 'text-purple-600', bg: 'bg-purple-50' },
    rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50' },
    accepted: { label: 'Accepted', color: 'text-teal-600', bg: 'bg-teal-50' },
};

export default function ApplicationsPage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [appsData, statsData] = await Promise.all([
                apiClient.get<Application[]>('/applications'),
                apiClient.get<any>('/applications/stats'),
            ]);
            setApplications(appsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load applications', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Please sign in to view your applications</h2>
                    <Link href="/login" className="mt-4 inline-block btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 bg-slate-50/50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Rental Path</h1>
                        <p className="text-slate-500 font-medium mt-2">Track your AI-powered applications across Berlin & Munich.</p>
                    </div>
                    {stats && (
                        <div className="flex gap-4">
                            <div className="glass-card px-6 py-3 rounded-2xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                                <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                            </div>
                            <div className="glass-card px-6 py-3 rounded-2xl border-emerald-100 bg-emerald-50/30">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Active</span>
                                <span className="text-2xl font-black text-emerald-700">{stats.byStatus?.sent || 0}</span>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="glass-card py-24 text-center rounded-3xl border-dashed border-2">
                        <div className="text-5xl mb-6">🎩</div>
                        <h3 className="text-xl font-bold text-slate-800">No applications yet</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                            Use "Der Diplomat" on any listing to generate a professional
                            German application and track it here.
                        </p>
                        <Link href="/listings" className="mt-8 inline-block btn-primary px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm">
                            Find Properties
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="glass-card p-6 rounded-3xl hover:shadow-xl transition-all group border border-slate-100 bg-white">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Image */}
                                    <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-100">
                                        <img
                                            src={app.listing?.images?.[0] || '/placeholder.jpg'}
                                            alt={app.listing?.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_MAP[app.status]?.bg} ${STATUS_MAP[app.status]?.color}`}>
                                                {STATUS_MAP[app.status]?.label || app.status}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Applied {new Date(app.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <Link href={`/listings/${app.listingId}`} className="block">
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                                                {app.listing?.title}
                                            </h3>
                                        </Link>

                                        <p className="text-slate-500 font-medium text-sm mt-1">
                                            📍 {app.listing?.locationName} • €{app.listing?.priceWarm} warm
                                        </p>

                                        {app.notes && (
                                            <p className="mt-3 text-xs text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                {app.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col items-center justify-center gap-3 md:pl-6 md:border-l border-slate-100">
                                        <Link
                                            href={`/listings/${app.listingId}`}
                                            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-600 transition-colors whitespace-nowrap"
                                        >
                                            View Property
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
