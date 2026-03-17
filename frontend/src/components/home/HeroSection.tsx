"use client";

import React from 'react';
import SearchCommandCenter from './SearchCommandCenter';

export default function HeroSection() {
    return (
        <section className="text-center space-y-6 mb-12 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black tracking-widest leading-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                AI-POWERED SEARCH LIVE
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Find your next home in Germany, <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">
                    without the stress.
                </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed font-medium">
                The all-in-one platform for verified listings, AI-driven fraud detection,
                and automated applications. One source for all major portals.
            </p>

            {/* Search Command Center */}
            <SearchCommandCenter />
        </section>
    );
}
