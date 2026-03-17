/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/listings/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { authApi, getListingById } from '@/lib/api';

interface Listing {
    id: string;
    title: string;
    priceWarm: number;
    size: number;
    rooms: number;
    locationName: string;
    address: string;
    images: string[];
    status: string;
    trustScore: number;
    listingType: string;
    platform: string;
}

export default function WatchlistPage() {
    const { user } = useAuth();
    // const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        loadSavedListings();
    }, [user]);

    const loadSavedListings = async () => {
        setLoading(true);
        try {
            const savedIds: string[] = await authApi.getSavedListings();
            if (savedIds.length === 0) {
                setListings([]);
                return;
            }
            // Fetch details for each saved listing
            const results = await Promise.allSettled(
                savedIds.map((id) => getListingById(id))
            );
            const loaded = results
                .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
                .map((r) => r.value);
            setListings(loaded);
        } catch (err) {
            console.error('Failed to load watchlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (listingId: string) => {
        setRemovingId(listingId);
        try {
            await authApi.unsaveListing(listingId);
            setListings((prev) => prev.filter((l) => l.id !== listingId));
        } catch (err) {
            console.error('Failed to unsave:', err);
        } finally {
            setRemovingId(null);
        }
    };

    // Not logged in
    if (!user && !loading) {
        return (
            <div className="min-h-screen pt-28 pb-16 px-4">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        My Watchlist
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                        Sign in to save listings and build your watchlist.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/login"
                            className="btn-primary !px-8 !py-4 uppercase tracking-widest text-xs font-black"
                        >
                            Sign In
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
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        📑 My Watchlist
                    </h1>
                    <p className="text-slate-600 font-medium">
                        {loading
                            ? 'Loading your saved listings...'
                            : listings.length > 0
                                ? `${listings.length} saved listing${listings.length === 1 ? '' : 's'}`
                                : 'No saved listings yet.'}
                    </p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && listings.length === 0 && (
                    <div className="glass-card rounded-3xl p-12 text-center space-y-6">
                        <div className="text-6xl">🏠</div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            No saved listings yet
                        </h2>
                        <p className="text-slate-600 font-medium max-w-md mx-auto">
                            Browse listings and click &quot;Save for Later&quot; on any listing
                            you&apos;re interested in. They&apos;ll appear here for easy access.
                        </p>
                        <Link
                            href="/search"
                            className="btn-primary inline-block !px-8 !py-4 uppercase tracking-widest text-xs font-black"
                        >
                            Browse Listings
                        </Link>
                    </div>
                )}

                {/* Listing Grid */}
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <div key={listing.id} className="relative group">
                                <ListingCard listing={listing} />
                                {/* Unsave overlay button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnsave(listing.id);
                                    }}
                                    disabled={removingId === listing.id}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/90 backdrop-blur-sm border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    title="Remove from watchlist"
                                >
                                    {removingId === listing.id ? (
                                        <div className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
