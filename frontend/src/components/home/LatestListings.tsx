"use client";

import React from 'react';
import Link from 'next/link';
import ListingCard from '@/components/listings/ListingCard';

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
    createdAt?: string;
}

interface LatestListingsProps {
    listings: Listing[];
    loading: boolean;
    latestTime: string;
}

export default function LatestListings({ listings, loading, latestTime }: LatestListingsProps) {
    return (
        <section className="space-y-8 mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Latest Verified Listings</h2>
                    <p className="text-slate-600 font-medium tracking-tight">
                        {listings.length > 0
                            ? `Verified by our Hawk agent. Updated ${latestTime || 'recently'}.`
                            : 'Loading fresh listings from our database...'}
                    </p>
                </div>
                <Link href="/search" className="text-teal-600 font-black text-xs tracking-widest uppercase hover:underline">
                    View All Active Feed →
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                        <p className="text-slate-600 font-medium">Loading listings...</p>
                    </div>
                </div>
            ) : listings.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No listings yet</h3>
                    <p className="text-slate-600">Run the scraper to start populating listings, or use the seed script.</p>
                </div>
            )}
        </section>
    );
}
