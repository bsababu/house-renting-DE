'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const verificationSteps = [
    {
        title: 'Complete Your Profile',
        description:
            'Fill in your occupation, income, Schufa status, and introduction. This data powers the Diplomat agent\'s personalized applications.',
        icon: '👤',
        action: 'Go to Profile',
        href: '/profile',
        required: true,
    },
    {
        title: 'Income Verification',
        description:
            'Upload your last 3 payslips or employment contract to prove income stability. Landlords prioritize verified tenants.',
        icon: '💰',
        action: 'Upload in Vault',
        href: '/vault',
        required: true,
    },
    {
        title: 'Schufa Check',
        description:
            'Link your Schufa credit report or upload your Schufa self-assessment. A good Schufa score dramatically improves your chances.',
        icon: '📊',
        action: 'Upload in Vault',
        href: '/vault',
        required: true,
    },
    {
        title: 'ID Verification',
        description:
            'Verify your identity with a government-issued ID or passport. This earns you a "Verified" badge visible to landlords.',
        icon: '🪪',
        action: 'Upload in Vault',
        href: '/vault',
        required: false,
    },
];

export default function VerifyPage() {
    const { user } = useAuth();

    // Simple completion check based on user profile
    const completedSteps = user?.firstName ? 1 : 0;
    const totalSteps = verificationSteps.length;
    const completionPercent = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Get{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">
                            Verified
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
                        Verified tenants get 3x more landlord responses. Complete these
                        steps to earn your verified badge.
                    </p>
                </div>

                {/* Progress */}
                <div className="glass-card rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                            Verification Progress
                        </span>
                        <span className="text-sm font-bold text-teal-700">
                            {completedSteps}/{totalSteps} complete
                        </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {verificationSteps.map((step, idx) => {
                        const isCompleted = idx < completedSteps;
                        return (
                            <div
                                key={step.title}
                                className={`glass-card rounded-2xl p-6 transition-all duration-300 ${isCompleted
                                    ? 'border-l-4 border-l-emerald-500'
                                    : 'hover:shadow-lg'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl flex-shrink-0">{step.icon}</div>
                                    <div className="flex-grow space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-900">{step.title}</h3>
                                            {step.required && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                                    Required
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    ✓ Done
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {step.href ? (
                                            <Link
                                                href={step.href}
                                                className="btn-primary !py-2 !px-5 text-xs font-black uppercase tracking-widest"
                                            >
                                                {step.action}
                                            </Link>
                                        ) : (
                                            <button
                                                disabled
                                                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-black uppercase tracking-widest cursor-not-allowed"
                                            >
                                                {step.action}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Box */}
                <div className="mt-8 glass-card rounded-2xl p-6 text-center space-y-3">
                    <p className="text-sm text-slate-500 font-medium">
                        💡 Even completing just your profile gives Diplomat better data to
                        write stronger applications.
                    </p>
                    {!user && (
                        <Link
                            href="/register"
                            className="btn-primary inline-block !py-3 !px-8 text-xs font-black uppercase tracking-widest"
                        >
                            Create Account to Get Started
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
