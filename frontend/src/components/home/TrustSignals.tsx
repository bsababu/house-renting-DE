"use client";

import React from 'react';

export default function TrustSignals() {
    return (
        <section className="grid md:grid-cols-3 gap-8 mb-32">
            <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Scam Protection</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                    Our AI &quot;Hawk&quot; scans every listing for inconsistencies and suspicious photos to keep you safe.
                </p>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Zero-Delay Feed</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                    Aggregate listings from ImmoScout, WG-Gesucht, and more in real-time. Be the first to apply.
                </p>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Auto-Applications</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                    The &quot;Diplomat&quot; agent handles your communication with landlords, sending professional German packets.
                </p>
            </div>
        </section>
    );
}
