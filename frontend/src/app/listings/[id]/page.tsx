/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getListingById, authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ReviewSection from '@/components/reviews/ReviewSection';
import NeighborhoodCard from '@/components/listings/NeighborhoodCard';
import DiplomatPreview from '@/components/diplomat/DiplomatPreview';
import TrustReport from '@/components/listings/TrustReport';

export default function ListingDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savingState, setSavingState] = useState(false);
    const [showDiplomat, setShowDiplomat] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getListingById(params.id as string);
                setListing(data);
            } catch {
                console.error('Listing not found');
                setListing(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.id]);

    // Check if listing is saved
    useEffect(() => {
        if (user && params.id) {
            authApi.getSavedListings().then(saved => {
                setIsSaved(saved.includes(params.id as string));
            }).catch(() => { });
        }
    }, [user, params.id]);

    const handleApply = () => {
        if (!user) {
            alert('Please sign in to use the Diplomat.');
            return;
        }
        setShowDiplomat(true);
    };

    const handleSave = async () => {
        if (!user) {
            alert('Please sign in to save listings.');
            return;
        }
        setSavingState(true);
        try {
            if (isSaved) {
                await authApi.unsaveListing(params.id as string);
                setIsSaved(false);
            } else {
                await authApi.saveListing(params.id as string);
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSavingState(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-24">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <div className="text-slate-500 font-semibold tracking-widest text-sm uppercase">Loading property...</div>
            </div>
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen flex items-center justify-center pt-24">
            <div className="text-center">
                <div className="text-5xl mb-4">🏚️</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Property Not Found</h2>
                <p className="text-slate-600">This listing may have been removed or the URL is incorrect.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-32 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {listing.status === 'verified' && (
                                    <span className="badge-verified">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.9L10 1.5l7.834 3.4a1 1 0 01.666.927v4.7c0 5.057-3.413 9.67-8 11.473-4.587-1.803-8-6.416-8-11.473V5.827a1 1 0 01.666-.927zM10 8.25a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75zM10 14a.875.875 0 100-1.75.875.875 0 000 1.75z" clipRule="evenodd" />
                                        </svg>
                                        VERIFIED OWNER
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black tracking-widest uppercase border border-teal-200/50">
                                    {listing.trustScore || 90}% PROFILE MATCH
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {listing.title}
                            </h1>

                            <div className="flex items-center gap-4 text-slate-600 font-medium">
                                <span className="flex items-center gap-1">
                                    📍 {listing.locationName || listing.location}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>📐 {listing.size}m²</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>🛏️ {listing.rooms || 1} Rooms</span>
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
                            <img
                                src={listing.images?.[0] || '/placeholder.jpg'}
                                className="w-full h-full object-cover"
                                alt="Main view"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">About this home</h2>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                {listing.descriptionSummary || "No description available."}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(listing.features || []).map((f: string) => (
                                    <div key={f} className="flex items-center gap-3 text-slate-700 font-medium glass-card p-4 rounded-2xl">
                                        <span className="text-teal-600 text-lg font-bold">✓</span>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reviews */}
                        <ReviewSection targetId={listing.id} targetType="listing" />

                        {/* Neighborhood Intelligence */}
                        {listing.neighborhoodData && (
                            <NeighborhoodCard data={listing.neighborhoodData} />
                        )}
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card p-8 rounded-3xl shadow-lg sticky top-28">
                            <div className="space-y-1 mb-8">
                                <div className="text-4xl font-black text-slate-900">€{listing.priceWarm || listing.priceCold}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Rent per Month</div>
                            </div>

                            <div className="space-y-4 border-y border-slate-100 py-8 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cold Rent</span>
                                    <span className="text-slate-900 font-black text-lg">€{listing.priceCold}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Utilities</span>
                                    <span className="text-slate-900 font-black text-lg">€{(listing.priceWarm - listing.priceCold) || 0}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleApply}
                                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98] btn-primary !py-5"
                            >
                                🎩 Apply via Diplomat
                            </button>

                            {showDiplomat && listing && (
                                <DiplomatPreview
                                    listingId={listing.id}
                                    listingTitle={listing.title}
                                    onClose={() => setShowDiplomat(false)}
                                />
                            )}

                            <button
                                onClick={handleSave}
                                disabled={savingState}
                                className={`w-full mt-4 py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all ${isSaved
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'btn-ghost'
                                    } disabled:opacity-50`}
                            >
                                {savingState
                                    ? 'Saving...'
                                    : isSaved
                                        ? '✓ Saved to your list'
                                        : 'Save for Later'
                                }
                            </button>

                            <div className="mt-8 glass-card p-4 rounded-2xl text-center">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Estimated response time</p>
                                <p className="text-slate-700 font-bold text-sm">Within 24 hours</p>
                            </div>

                            {/* Trust Analysis */}
                            <div className="mt-4">
                                <TrustReport listingId={listing.id} />
                                <Link href="/safety" className="block text-center text-[10px] text-slate-400 font-bold hover:underline mt-4 uppercase tracking-widest">
                                    How we detect scams →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
