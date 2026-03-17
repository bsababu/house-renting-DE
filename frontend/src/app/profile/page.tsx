/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    // const { logout } = useAuth();
    // const router = useRouter();
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        occupation: '',
        monthlyIncome: '',
        schufaStatus: '',
        moveInDate: '',
        introText: '',
        hasWBS: false,
        preferredCity: '',
        // Matching Preferences
        maxBudget: '',
        minSize: '',
        minRooms: '',
        preferredDistricts: '',
        balcony: false,
        parking: false,
    });

    // Load profile on mount
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        const loadProfile = async () => {
            try {
                const userData = await authApi.getProfile();
                setProfile({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    occupation: userData.profileData?.occupation || '',
                    monthlyIncome: userData.profileData?.monthlyIncome || '',
                    schufaStatus: userData.profileData?.schufaStatus || '',
                    moveInDate: userData.profileData?.moveInDate || '',
                    introText: userData.profileData?.introText || '',
                    hasWBS: userData.profileData?.hasWBS || false,
                    preferredCity: userData.profileData?.preferredCity || '',
                    maxBudget: userData.profileData?.maxBudget?.toString() || '',
                    minSize: userData.profileData?.minSize?.toString() || '',
                    minRooms: userData.profileData?.minRooms?.toString() || '',
                    preferredDistricts: userData.profileData?.preferredDistricts || '',
                    balcony: userData.profileData?.balcony || false,
                    parking: userData.profileData?.parking || false,
                });
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await authApi.updateProfile(profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    // Completion tracker
    const fields = Object.values(profile).filter(v => v !== '' && v !== false);
    const completionPercent = Math.round((fields.length / Object.keys(profile).length) * 100);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Please log in</h2>
                    <p className="text-slate-600">You need to sign in to access your profile.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Profile</h1>
                    <p className="text-slate-600">
                        Complete your profile so our Diplomat agent can write better applications for you.
                    </p>
                </div>

                {/* Progress bar */}
                <div className="glass-card rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Profile Completion</span>
                        <span className="text-sm font-bold text-teal-700">{completionPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>

                {/* Profile form */}
                <div className="glass-card rounded-2xl p-8 space-y-6">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">First Name</label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => updateField('firstName', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Last Name</label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => updateField('lastName', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Occupation */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Occupation</label>
                        <input
                            type="text"
                            value={profile.occupation}
                            onChange={(e) => updateField('occupation', e.target.value)}
                            placeholder="e.g. Software Engineer, Student, Doctor"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Income + Schufa */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Monthly Income (€)</label>
                            <input
                                type="text"
                                value={profile.monthlyIncome}
                                onChange={(e) => updateField('monthlyIncome', e.target.value)}
                                placeholder="e.g. 3500"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Schufa Status</label>
                            <select
                                value={profile.schufaStatus}
                                onChange={(e) => updateField('schufaStatus', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            >
                                <option value="">Select...</option>
                                <option value="excellent">Excellent (97-100%)</option>
                                <option value="good">Good (90-97%)</option>
                                <option value="fair">Fair (80-90%)</option>
                                <option value="poor">Below Average (&lt;80%)</option>
                                <option value="no_record">No Schufa Record</option>
                            </select>
                        </div>
                    </div>

                    {/* Preferred City + Move-in Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Preferred City</label>
                            <input
                                type="text"
                                value={profile.preferredCity}
                                onChange={(e) => updateField('preferredCity', e.target.value)}
                                placeholder="e.g. Berlin"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Earliest Move-in</label>
                            <input
                                type="date"
                                value={profile.moveInDate}
                                onChange={(e) => updateField('moveInDate', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* WBS Checkbox */}
                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="wbs"
                            checked={profile.hasWBS}
                            onChange={(e) => updateField('hasWBS', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                        />
                        <label htmlFor="wbs" className="text-sm font-medium text-slate-700">
                            I have a WBS (Wohnberechtigungsschein)
                        </label>
                    </div>

                    {/* Intro Text */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                            Introduction (used in applications)
                        </label>
                        <textarea
                            value={profile.introText}
                            onChange={(e) => updateField('introText', e.target.value)}
                            rows={4}
                            placeholder="Tell landlords about yourself — the Diplomat agent uses this to personalize your applications..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium resize-none"
                        />
                    </div>

                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-4 font-black uppercase tracking-widest rounded-xl text-white transition-all duration-200 ${saved
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'btn-primary !py-4'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Saving...
                            </span>
                        ) : saved ? '✓ Profile Saved!' : 'Save Changes'}
                    </button>
                </div>

                {/* Matching Preferences */}
                <div className="glass-card rounded-2xl p-8 space-y-6 mt-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">🎯 Matching Preferences</h2>
                        <p className="text-sm text-slate-500">Set your preferences to get personalized match scores on every listing.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Max Budget (€/mo)</label>
                            <input
                                type="number"
                                value={profile.maxBudget}
                                onChange={(e) => updateField('maxBudget', e.target.value)}
                                placeholder="e.g. 1200"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Min Size (m²)</label>
                            <input
                                type="number"
                                value={profile.minSize}
                                onChange={(e) => updateField('minSize', e.target.value)}
                                placeholder="e.g. 40"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Min Rooms</label>
                            <input
                                type="number"
                                value={profile.minRooms}
                                onChange={(e) => updateField('minRooms', e.target.value)}
                                placeholder="e.g. 2"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Preferred Districts</label>
                        <input
                            type="text"
                            value={profile.preferredDistricts}
                            onChange={(e) => updateField('preferredDistricts', e.target.value)}
                            placeholder="e.g. Kreuzberg, Neukölln, Wedding"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all font-medium"
                        />
                        <p className="text-xs text-slate-400 mt-1 px-1">Comma-separated list of preferred neighborhoods</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="balcony"
                                checked={profile.balcony}
                                onChange={(e) => updateField('balcony', e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                            />
                            <label htmlFor="balcony" className="text-sm font-medium text-slate-700">Balcony required</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="parking"
                                checked={profile.parking}
                                onChange={(e) => updateField('parking', e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                            />
                            <label htmlFor="parking" className="text-sm font-medium text-slate-700">Parking required</label>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-4 font-black uppercase tracking-widest rounded-xl text-white transition-all duration-200 ${saved
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'btn-primary !py-4'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {saving ? 'Saving...' : saved ? '✓ Preferences Saved!' : 'Save Matching Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}
