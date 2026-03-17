/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/admin.service';

type Tab = 'overview' | 'users' | 'listings' | 'scrapers';

export default function AdminDashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Redirect non-admin users
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) return <Loading />;
    if (!user || user.role !== 'admin') return null;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'listings', label: 'Listings', icon: '🏠' },
        { id: 'scrapers', label: 'Scrapers', icon: '🤖' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Platform management & monitoring</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8 p-1 bg-white/60 backdrop-blur rounded-2xl border border-slate-200/50 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/80'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'listings' && <ListingsTab />}
                {activeTab === 'scrapers' && <ScrapersTab />}
            </div>
        </div>
    );
}

// ── Loading ──────────────────────────────────────────
function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
    );
}

// ── Stat Card ────────────────────────────────────────
function StatCard({ label, value, sub, color = 'teal' }: { label: string; value: string | number; sub?: string; color?: string }) {
    const colors: Record<string, string> = {
        teal: 'from-teal-500 to-emerald-500',
        amber: 'from-amber-500 to-orange-500',
        red: 'from-red-500 to-rose-500',
        blue: 'from-blue-500 to-indigo-500',
    };
    return (
        <div className="glass-card p-6 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{label}</p>
            <p className={`text-4xl font-black bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>{value}</p>
            {sub && <p className="text-xs text-slate-500 font-medium mt-1">{sub}</p>}
        </div>
    );
}

// ══════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════
function OverviewTab() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;
    if (!stats) return <p className="text-slate-500">Failed to load stats</p>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Users" value={stats.users.total} sub={`${stats.users.recentSignups} this week`} />
                <StatCard label="Total Listings" value={stats.listings.total} color="blue" />
                <StatCard label="Active Listings" value={stats.listings.active} color="teal" />
                <StatCard label="Scam Flagged" value={stats.listings.scam} color="red" sub="Need review" />
            </div>

            {/* Platform breakdown */}
            <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Listings by Platform</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(stats.listings.byPlatform || []).map((p: any) => (
                        <div key={p.platform} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-bold text-slate-600">{p.platform || 'Unknown'}</span>
                            <span className="text-lg font-black text-slate-900">{p.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════
// USERS TAB
// ══════════════════════════════════════════════════════
function UsersTab() {
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const result = await adminService.getUsers(p, 15);
            setData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(page); }, [page, load]);

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Change this user's role to ${newRole}?`)) return;
        try {
            await adminService.updateUserRole(userId, newRole);
            load(page);
        } catch (err) { console.error(err); }
    };

    if (loading && !data) return <Loading />;

    return (
        <div className="space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/80">
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joined</th>
                            <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(data?.data || []).map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{u.firstName || ''} {u.lastName || ''}</p>
                                    <p className="text-xs text-slate-500">{u.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>{u.role}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleRoleToggle(u.id, u.role)}
                                        className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
                                    >
                                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
        </div>
    );
}

// ══════════════════════════════════════════════════════
// LISTINGS TAB
// ══════════════════════════════════════════════════════
function ListingsTab() {
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (p: number, s?: string, pl?: string) => {
        setLoading(true);
        try {
            const result = await adminService.getListings(p, 15, s || undefined, pl || undefined);
            setData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(page, statusFilter, platformFilter); }, [page, statusFilter, platformFilter, load]);

    const handleStatusChange = async (listingId: string, newStatus: string) => {
        try {
            await adminService.updateListingStatus(listingId, newStatus);
            load(page, statusFilter, platformFilter);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Permanently delete this listing?')) return;
        try {
            await adminService.deleteListing(listingId);
            load(page, statusFilter, platformFilter);
        } catch (err) { console.error(err); }
    };

    if (loading && !data) return <Loading />;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="scam">Scam</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select
                    value={platformFilter}
                    onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                    <option value="">All Platforms</option>
                    <option value="Kleinanzeigen">Kleinanzeigen</option>
                    <option value="Immowelt">Immowelt</option>
                    <option value="WG-Gesucht">WG-Gesucht</option>
                    <option value="ImmoScout24">ImmoScout24</option>
                </select>
                <span className="text-sm text-slate-500 font-medium">
                    {data?.total || 0} total
                </span>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/80">
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trust</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(data?.data || []).map((l: any) => (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">{l.title}</p>
                                    <p className="text-xs text-slate-500">€{Math.round(l.priceWarm)} · {l.locationName || '—'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{l.platform}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-black ${l.trustScore >= 80 ? 'text-emerald-600' :
                                            l.trustScore >= 50 ? 'text-amber-600' : 'text-red-600'
                                        }`}>{l.trustScore}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={l.status}
                                        onChange={(e) => handleStatusChange(l.id, e.target.value)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none cursor-pointer ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                l.status === 'scam' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        <option value="active">Active</option>
                                        <option value="scam">Scam</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(l.id)}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
        </div>
    );
}

// ══════════════════════════════════════════════════════
// SCRAPERS TAB
// ══════════════════════════════════════════════════════
function ScrapersTab() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleScan = async () => {
        setScanning(true);
        setError('');
        setResult(null);
        try {
            const res = await adminService.triggerScan();
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-8 rounded-2xl">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Manual Scraper Control</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Trigger a full scan across all platforms (WG-Gesucht, ImmoScout24, Immowelt, Kleinanzeigen).
                    The hourly cron also runs this automatically.
                </p>
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98] bg-slate-900 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {scanning ? (
                        <span className="flex items-center gap-3">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Scanning all platforms...
                        </span>
                    ) : '🔍 Scan Now'}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error}
                    </div>
                )}
            </div>

            {result && (
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Scan Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(Array.isArray(result) ? result : [result]).map((r: any, i: number) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-xl space-y-2">
                                <p className="font-bold text-slate-700">{r.name || r.platform || `Agent ${i + 1}`}</p>
                                <p className="text-2xl font-black text-teal-600">{r.total ?? r.new ?? '—'}</p>
                                <p className="text-xs text-slate-500">{r.new ?? 0} new · {r.duplicates ?? 0} dupes</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Platform info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { name: 'WG-Gesucht', desc: 'Shared flats & rooms', emoji: '🏘️' },
                    { name: 'ImmoScout24', desc: 'Germany\'s largest portal', emoji: '🏢' },
                    { name: 'Immowelt', desc: 'Professional listings', emoji: '🏗️' },
                    { name: 'Kleinanzeigen', desc: 'Private classifieds', emoji: '📋' },
                ].map((p) => (
                    <div key={p.name} className="glass-card p-5 rounded-2xl text-center">
                        <div className="text-3xl mb-2">{p.emoji}</div>
                        <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">{p.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Pagination ───────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
                ← Prev
            </button>
            <span className="text-sm font-bold text-slate-500 px-4">
                {page} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
                Next →
            </button>
        </div>
    );
}
