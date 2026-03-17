"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchCommandCenter() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholderText, setPlaceholderText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const placeholders = [
        "Try '2 room apartment in Mitte'",
        "Try 'Apartment with balcony < 1200€'",
        "Try 'Pet friendly in Kreuzberg'",
        "Try 'Furnished studio near Alexanderplatz'"
    ];

    useEffect(() => {
        const currentFullText = placeholders[placeholderIndex];
        let timeout: NodeJS.Timeout;

        if (isDeleting) {
            timeout = setTimeout(() => {
                setPlaceholderText(currentFullText.substring(0, placeholderText.length - 1));
            }, 50);
        } else {
            timeout = setTimeout(() => {
                setPlaceholderText(currentFullText.substring(0, placeholderText.length + 1));
            }, 100);
        }

        if (!isDeleting && placeholderText === currentFullText) {
            timeout = setTimeout(() => setIsDeleting(true), 2000);
        } else if (isDeleting && placeholderText === '') {
            setIsDeleting(false);
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }

        return () => clearTimeout(timeout);
    }, [placeholderText, isDeleting, placeholderIndex, placeholders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        } else {
            router.push('/search');
        }
    };

    const navigateSearch = (query: string) => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="max-w-3xl mx-auto pt-4">
            <form onSubmit={handleSearch} className="w-full">
                <div className="relative group z-20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/50">
                        <span className="pl-4 text-2xl">🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-slate-800 text-lg px-4 py-3 focus:ring-0 placeholder-slate-400/0 font-medium"
                            placeholder="Search..." // Hidden via opacity for custom animation
                        />
                        {/* Typing Animation Overlay */}
                        {!query && (
                            <div className="absolute left-14 top-0 bottom-0 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-lg font-medium">
                                    {placeholderText}
                                    <span className="animate-pulse">|</span>
                                </span>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:scale-105 active:scale-95 ml-2"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </form>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-500 font-bold tracking-widest">
                <span className="text-slate-400">POPULAR:</span>
                <button onClick={() => navigateSearch('apartments in Berlin Mitte')} className="hover:text-teal-600 transition-colors">BERLIN MITTE</button>
                <button onClick={() => navigateSearch('apartments in Munich Schwabing')} className="hover:text-teal-600 transition-colors">MUNICH SCHWABING</button>
                <button onClick={() => navigateSearch('apartments in Hamburg Altona')} className="hover:text-teal-600 transition-colors">HAMBURG ALTONA</button>
            </div>
        </div>
    );
}
