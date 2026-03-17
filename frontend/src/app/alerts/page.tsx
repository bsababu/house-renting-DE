'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
// import Link from 'next/link';

interface Alert {
    id: string;
    name: string;
    filters: {
        city: string;
        maxPrice?: number;
        minSize?: number;
        minRooms?: number;
    };
    autoApply: boolean;
    enabled: boolean;
    lastTriggeredAt: string | null;
    createdAt: string;
}

export default function AlertsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // New Alert Form State
    const [newAlert, setNewAlert] = useState({
        name: '',
        city: 'Berlin',
        maxPrice: '',
        minSize: '',
        minRooms: '',
        autoApply: false,
    });

    const fetchAlerts = async () => {
        try {
            const data = await authApi.getAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchAlerts();
        }
    }, [user, authLoading, router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authApi.createAlert({
                name: newAlert.name,
                filters: {
                    city: newAlert.city,
                    maxPrice: newAlert.maxPrice ? Number(newAlert.maxPrice) : undefined,
                    minSize: newAlert.minSize ? Number(newAlert.minSize) : undefined,
                    minRooms: newAlert.minRooms ? Number(newAlert.minRooms) : undefined,
                },
                autoApply: newAlert.autoApply,
                enabled: true,
            });
            setNewAlert({ name: '', city: 'Berlin', maxPrice: '', minSize: '', minRooms: '', autoApply: false });
            setCreating(false);
            fetchAlerts();
        } catch (error) {
            console.error('Failed to create alert:', error);
            alert('Failed to create alert');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this alert?')) return;
        try {
            await authApi.deleteAlert(id);
            fetchAlerts();
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Instant Alerts</h1>
                        <p className="text-slate-600">
                            Get notified immediately when new listings match your criteria.
                        </p>
                    </div>
                    <button
                        onClick={() => setCreating(!creating)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Alert
                    </button>
                </div>

                {creating && (
                    <div className="glass-card p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold text-lg mb-4">New Alert Criteria</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Alert Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Berlin 2-Room"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        value={newAlert.name}
                                        onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        value={newAlert.city}
                                        onChange={e => setNewAlert({ ...newAlert, city: e.target.value })}
                                    >
                                        <option value="Berlin">Berlin</option>
                                        <option value="Munich">Munich</option>
                                        <option value="Hamburg">Hamburg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Max Price (€)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 1200"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        value={newAlert.maxPrice}
                                        onChange={e => setNewAlert({ ...newAlert, maxPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Min Size (m²)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 50"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        value={newAlert.minSize}
                                        onChange={e => setNewAlert({ ...newAlert, minSize: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-2 p-4 bg-gradient-to-r from-indigo-50 to-teal-50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="autoApply"
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                        checked={newAlert.autoApply}
                                        onChange={e => setNewAlert({ ...newAlert, autoApply: e.target.checked })}
                                    />
                                    <label htmlFor="autoApply" className="text-sm font-bold text-slate-800">
                                        ⚡ Enable <strong>Auto-Apply</strong>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 ml-8 mt-1.5">
                                    🎩 The Diplomat will instantly generate and send a German <em>Bewerbungsschreiben</em> for every
                                    matching listing — using your profile data. Speed wins apartments.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCreating(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Save Alert
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-4">
                    {alerts.length === 0 && !creating && (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <span className="text-4xl">🔔</span>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">No alerts active</h3>
                            <p className="text-slate-500">Create an alert to stop refreshing manually.</p>
                        </div>
                    )}

                    {alerts.map(alert => (
                        <div key={alert.id} className="glass-card p-6 rounded-2xl flex items-center justify-between transition-all hover:shadow-md">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-slate-900">{alert.name}</h3>
                                    {alert.autoApply && (
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                                            Auto-Apply On
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${alert.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {alert.enabled ? 'Active' : 'Paused'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {alert.filters.city} •
                                    {alert.filters.maxPrice ? ` < €${alert.filters.maxPrice}` : ''} •
                                    {alert.filters.minSize ? ` > ${alert.filters.minSize}m²` : ''}
                                </p>
                                {alert.lastTriggeredAt && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        Last triggered: {new Date(alert.lastTriggeredAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(alert.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
