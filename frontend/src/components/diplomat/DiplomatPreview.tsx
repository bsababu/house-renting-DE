/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { apiClient } from '@/services/api.client';

interface DiplomatPreviewProps {
    listingId: string;
    listingTitle: string;
    onClose: () => void;
}

export default function DiplomatPreview({ listingId, listingTitle, onClose }: DiplomatPreviewProps) {
    const [letter, setLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const [applicationId, setApplicationId] = useState<string | null>(null);

    const generatePreview = async () => {
        setGenerating(true);
        setError('');
        try {
            const res = await apiClient.post<any>(`/diplomat/preview/${listingId}`, {});
            setLetter(res.letter);
            setApplicationId(res.applicationId);
        } catch (err: any) {
            setError(err.message || 'Failed to generate application');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(letter);
            if (applicationId) {
                // Update status to GENERATED/CLIPBOARD if copy used
                await apiClient.patch(`/applications/${applicationId}/status`, {
                    status: 'generated',
                    notes: 'Letter copied to clipboard for manual sending.'
                });
            }
            alert('Bewerbung in die Zwischenablage kopiert!');
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const sendApplication = async () => {
        setLoading(true);
        setError('');
        try {
            await apiClient.post<any>(`/diplomat/apply/${listingId}`, {});
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">🎩 Der Diplomat</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                AI-generated German Bewerbungsschreiben
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                            ✕
                        </button>
                    </div>
                    <p className="text-xs text-teal-600 font-semibold mt-3 px-3 py-1.5 bg-teal-50 rounded-lg inline-block">
                        Applying to: {listingTitle}
                    </p>
                </div>

                {/* Body */}
                <div className="px-8 pb-8">
                    {sent ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-lg font-black text-slate-900">Bewerbung gesendet!</h3>
                            <p className="text-sm text-slate-500 mt-2">Your application has been queued and will be sent shortly.</p>
                            <button onClick={onClose} className="mt-6 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                                Close
                            </button>
                        </div>
                    ) : !letter ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">🎩</div>
                            <h3 className="text-lg font-black text-slate-900">Let the Diplomat write your application</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                                Our AI will generate a personalized German rental application
                                based on your profile and this listing&apos;s details.
                            </p>
                            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                            <button
                                onClick={generatePreview}
                                disabled={generating}
                                className="mt-6 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {generating ? (
                                    <span className="flex items-center gap-3">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </span>
                                ) : '✍️ Generate Bewerbung'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Your Application Letter (editable)
                            </label>
                            <textarea
                                value={letter}
                                onChange={(e) => setLetter(e.target.value)}
                                rows={14}
                                className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 leading-relaxed font-medium resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
                            />
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={generatePreview}
                                    disabled={generating}
                                    className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    {generating ? '⏳ Regenerating...' : '🔄 Regenerate'}
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="px-5 py-3 rounded-xl border border-teal-200 text-teal-700 font-bold text-sm hover:bg-teal-50 transition-colors"
                                >
                                    📋 Copy
                                </button>
                                <button
                                    onClick={sendApplication}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 rounded-xl bg-teal-600 text-white font-black text-sm uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </span>
                                    ) : '📨 Send Application'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center">
                                Tip: You can edit the letter above before sending. The Diplomat uses your profile data.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
