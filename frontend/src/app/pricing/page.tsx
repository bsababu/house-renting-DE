'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api.client';

const PLANS = [
    {
        name: 'Free',
        price: '€0',
        description: 'Basic search and neighborhood insights.',
        features: [
            'Browse all listings',
            'Neighborhood scores',
            'Basic price alerts',
            'Community support'
        ],
        buttonText: 'Current Plan',
        isCurrent: true,
    },
    {
        name: 'Pro Search',
        price: '€19',
        period: '/month',
        description: 'The automated operating system for your search.',
        features: [
            'Everything in Free',
            'AI Application Writer (The Diplomat)',
            'Advanced Scam Protection (The Hawk)',
            'Priority Push Alerts',
            'AI Advisor Chatbot'
        ],
        buttonText: 'Upgrade to Pro',
        isPopular: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For relocation agencies and power searchers.',
        features: [
            'Unlimited AI applications',
            'API Access',
            'Dedicated search agent',
            'Bulk data exports'
        ],
        buttonText: 'Contact Sales',
    }
];

export default function PricingPage() {
    const { user } = useAuth();

    const handleUpgrade = async (planName: string) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        try {
            const res = await apiClient.post<{ url: string }>('/payments/create-checkout-session', {});
            if (res?.url) {
                window.location.href = res.url;
                return;
            }
            alert(`Failed to start checkout for ${planName}`);
        } catch (err: any) {
            alert(err.message || `Failed to start checkout for ${planName}`);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                        Simple, <span className="text-teal-600">Transparent</span> Pricing
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Automate your housing search and beat the competition with our AI-powered Pro plan.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`glass-card p-8 rounded-3xl border flex flex-col relative ${plan.isPopular
                                    ? 'border-teal-500 shadow-xl shadow-teal-500/10'
                                    : 'border-white/40'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500 font-medium">{plan.period}</span>}
                                </div>
                                <p className="mt-4 text-sm text-slate-500 font-medium">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="w-5 h-5 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(plan.name)}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${plan.isPopular
                                        ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
                                        : 'bg-white text-teal-600 border border-teal-100 hover:bg-teal-50'
                                    } ${plan.isCurrent ? 'opacity-50 cursor-default' : ''}`}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-500 text-sm">
                        All plans include 14-day money-back guarantee. <br />
                        Questions? <a href="#" className="text-teal-600 font-bold hover:underline">Chat with our AI Advisor</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
