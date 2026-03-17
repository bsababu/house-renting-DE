/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ListingCardProps {
    listing?: any;
    id?: string;
    title?: string;
    price?: string;
    size?: string;
    location?: string;
    matchScore?: number;
    isVerified?: boolean;
    image?: string;
}

export default function ListingCard(props: ListingCardProps) {
    // Support both object prop and individual props
    const listing = props.listing;
    const id = listing?.id || props.id;
    const title = listing?.title || props.title || 'Untitled';
    const price = listing ? `€${Math.round(listing.priceWarm)}` : props.price || '';
    const size = listing ? `${listing.size || '?'} m²` : props.size || '';
    const rooms = listing ? `${listing.rooms} Rooms` : '';
    const location = listing?.locationName || listing?.address || props.location || '';
    const matchScore = listing?.matchScore ?? props.matchScore ?? listing?.trustScore ?? 0;
    const isVerified = listing ? listing.status === 'verified' : (props.isVerified || false);
    const image = listing?.images?.[0] || props.image || '/placeholder.jpg';

    // Derived values
    const hasMatchScore = listing?.matchScore !== undefined || props.matchScore !== undefined;
    const isMock = id?.startsWith('mock-');
    const detailHref = isMock ? '/search' : `/listings/${id}`;

    const matchColor = matchScore >= 80 ? 'bg-emerald-500' :
        matchScore >= 60 ? 'bg-amber-500' :
            matchScore >= 40 ? 'bg-orange-500' : 'bg-rose-500';

    const [imgSrc, setImgSrc] = useState(image);

    useEffect(() => {
        setImgSrc(image);
    }, [image]);

    return (
        <div className="glass-card rounded-[1.5rem] overflow-hidden group hover:shadow-xl hover:shadow-teal-900/10 transition-all duration-500 border border-white/40">
            {/* Image Container - Compact */}
            <Link href={detailHref} className="block relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                <img
                    src={imgSrc}
                    onError={() => setImgSrc('/placeholder.jpg')}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Status Bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                    <div className="flex gap-2">
                        {isVerified && (
                            <div className="backdrop-blur-md bg-white/90 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                            </div>
                        )}
                    </div>

                    {(listing?.averageRating > 0 || hasMatchScore) && (
                        <div className={`backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black tracking-widest uppercase shadow-sm ${matchColor}`}>
                            {listing?.averageRating > 0 ? `★ ${listing.averageRating.toFixed(1)}` : `${matchScore}% Match`}
                        </div>
                    )}
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-4 left-4 z-20">
                    <div className="backdrop-blur-xl bg-slate-900/60 text-white px-4 py-2 rounded-2xl border border-white/10">
                        <span className="text-lg font-black tracking-tight">{price}</span>
                        <span className="text-slate-300 text-xs font-medium ml-1">/mo</span>
                    </div>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 space-y-3 bg-gradient-to-b from-white/40 to-white/10">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-teal-700 transition-colors line-clamp-1">{title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs font-semibold tracking-wide uppercase">
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            {size}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{rooms}</span>
                    </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{location}</span>
                </div>

                <div className="pt-2">
                    <Link href={detailHref} className="block w-full py-3 rounded-xl bg-slate-900 text-white text-center text-xs font-bold tracking-widest uppercase hover:bg-teal-600 transition-colors shadow-lg shadow-slate-900/10 active:scale-[0.98]">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}
