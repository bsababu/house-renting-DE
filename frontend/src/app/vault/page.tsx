'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
// import Link from 'next/link';

interface DocumentSummary {
    type: string;
    label: string;
    required: boolean;
    uploaded: boolean;
    status: 'pending' | 'verified' | 'rejected' | 'expired' | null;
    documentId: string | null;
    fileName: string | null;
    uploadedAt: string | null;
}

interface VaultSummary {
    documents: DocumentSummary[];
    totalUploaded: number;
    completionPercent: number;
    isComplete: boolean;
}

export default function VaultPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<VaultSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null); // type of doc being uploaded

    const fetchSummary = async () => {
        try {
            const data = await authApi.getVaultSummary();
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch vault summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchSummary();
        }
    }, [user, authLoading, router]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(type);
        try {
            await authApi.uploadDocument(file, type);
            await fetchSummary(); // Refresh list
        } catch (error) {
            alert('Failed to upload document. Please try again.');
            console.error(error);
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await authApi.deleteDocument(id);
            await fetchSummary();
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'verified':
                return <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">Verified</span>;
            case 'rejected':
                return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">Rejected</span>;
            case 'pending':
                return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide">Pending Review</span>;
            default:
                return null;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Document Vault</h1>
                        <p className="text-slate-600">
                            Securely store your rental documents. Verified documents increase your chances by 3x.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-500">Vault Health</span>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${summary?.completionPercent}%` }}
                                    />
                                </div>
                                <span className="font-bold text-slate-900">{summary?.completionPercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {summary?.documents.map((doc) => (
                        <div key={doc.type} className="glass-card rounded-2xl p-6 transition-all hover:shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
                                        ${doc.uploaded
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : doc.required ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-300'
                                        }`}
                                    >
                                        {doc.uploaded ? '✓' : '📄'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900">{doc.label}</h3>
                                            {doc.required && !doc.uploaded && (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-white font-bold uppercase tracking-wider">Required</span>
                                            )}
                                            {doc.uploaded && getStatusBadge(doc.status)}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-2">
                                            {doc.uploaded
                                                ? `Uploaded on ${new Date(doc.uploadedAt!).toLocaleDateString()}`
                                                : 'Upload PDF, JPG, or PNG (Max 10MB)'}
                                        </p>
                                        {doc.fileName && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {doc.fileName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {doc.uploaded ? (
                                        <button
                                            onClick={() => handleDelete(doc.documentId!)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Document"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id={`upload-${doc.type}`}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileUpload(e, doc.type)}
                                                disabled={uploading === doc.type}
                                            />
                                            <label
                                                htmlFor={`upload-${doc.type}`}
                                                className={`btn-secondary cursor-pointer flex items-center gap-2 ${uploading === doc.type ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {uploading === doc.type ? (
                                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                )}
                                                Upload
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                    <div className="text-blue-500 text-2xl">🛡️</div>
                    <div className="text-sm text-blue-800">
                        <h4 className="font-bold mb-1">Your data is encrypted & secure</h4>
                        <p className="opacity-80">
                            Documents are stored in a secure vault and are only shared with landlords when you explicitly submit an application.
                            We automatically watermark your documents (&quot;For Application Use Only&quot;) to prevent misuse.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
