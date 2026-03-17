/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await authApi.register(formData);
            const loginData = await authApi.login({
                email: formData.email,
                password: formData.password
            });
            await login(loginData.access_token);
            router.push('/search');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="max-w-md mx-auto mt-32 mb-32 px-6">
            <div className="glass-card p-10 rounded-3xl space-y-8 shadow-2xl shadow-teal-500/5">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Join the smart housing revolution in Germany.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">First Name</label>
                            <input
                                name="firstName"
                                required
                                onChange={handleChange}
                                placeholder="Jane"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Last Name</label>
                            <input
                                name="lastName"
                                required
                                onChange={handleChange}
                                placeholder="Doe"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            onChange={handleChange}
                            placeholder="jane@example.com"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Create Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            onChange={handleChange}
                            placeholder="Min. 8 characters"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary !py-4 uppercase tracking-widest font-black disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating Account...' : 'Join Platform'}
                        </button>
                    </div>
                </form>

                <div className="text-center pt-4">
                    <p className="text-sm font-medium text-slate-500">
                        Already have an account? {' '}
                        <Link href="/login" className="text-teal-600 font-black hover:underline uppercase tracking-widest text-xs">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
