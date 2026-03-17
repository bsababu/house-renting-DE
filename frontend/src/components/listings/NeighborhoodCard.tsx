import React from 'react';

interface NeighborhoodData {
    transitScore: number;
    walkScore: number;
    nearbyAmenities: string[];
    safetyScore: number;
    vibe: string;
}

export default function NeighborhoodCard({ data }: { data: NeighborhoodData }) {
    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-emerald-700'; // Darker green for mid-high
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-500';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                Neighborhood Intelligence
                <span className="text-xs font-black text-white bg-indigo-600 px-2 py-1 rounded-lg uppercase tracking-wider">
                    BETA
                </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Scores */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transit Score</p>
                            <p className="text-sm text-slate-600">Public transport accessibility</p>
                        </div>
                        <div className={`text-2xl font-black ${getScoreColor(data.transitScore)}`}>
                            {data.transitScore}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Walk Score</p>
                            <p className="text-sm text-slate-600">Errands accomplished on foot</p>
                        </div>
                        <div className={`text-2xl font-black ${getScoreColor(data.walkScore)}`}>
                            {data.walkScore}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Safety Score</p>
                            <p className="text-sm text-slate-600">Based on local reports</p>
                        </div>
                        <div className={`text-2xl font-black ${getScoreColor(data.safetyScore)}`}>
                            {data.safetyScore}%
                        </div>
                    </div>
                </div>

                {/* Vibe & Amenities */}
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Neighborhood Vibe</p>
                        <div className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                            ✨ {data.vibe}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby Amenities</p>
                        <div className="flex flex-wrap gap-2">
                            {data.nearbyAmenities.map((amenity, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full shadow-sm">
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
