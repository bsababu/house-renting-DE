
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface LiveScanButtonProps {
    city: string;
    maxPrice?: number;
    onScanComplete?: (count: number) => void;
}

export default function LiveScanButton({ city, maxPrice, onScanComplete }: LiveScanButtonProps) {
    const { token } = useAuth();
    const [status, setStatus] = useState<'idle' | 'queued' | 'scanning' | 'complete' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!token) return;

        // Initialize Socket for Live Updates
        const socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('SCAN_UPDATE', (data: any) => {
            console.log('SCAN_UPDATE', data);
            setStatus('scanning');
            setMessage(data.message);
        });

        socket.on('SCAN_COMPLETE', (data: any) => {
            console.log('SCAN_COMPLETE', data);
            setStatus('complete');
            setMessage(data.message);
            if (onScanComplete) onScanComplete(data.count);

            // Reset after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        });

        socket.on('SCAN_ERROR', (data: any) => {
            console.error('SCAN_ERROR', data);
            setStatus('error');
            setMessage(data.message);

            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, [token, onScanComplete]);

    const handleScan = async () => {
        if (!token) return;
        setStatus('queued');
        setMessage('Queuing scan...');

        try {
            const response = await fetch(`${apiUrl}/scraper/scan-live`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ city, maxPrice })
            });

            if (!response.ok) throw new Error('Failed to start scan');

            await response.json();
            // Status remains 'queued' until socket receives 'SCAN_UPDATE'
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Failed to start scan');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    if (status === 'idle') {
        return (
            <button
                onClick={handleScan}
                className="flex items-center gap-2 px-6 py-4 bg-white text-teal-800 border-2 border-teal-600/20 hover:border-teal-600 hover:bg-teal-50 rounded-xl transition-all shadow-xl font-bold text-lg hover:scale-105"
            >
                <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Check Live
            </button>
        );
    }

    return (
        <button
            disabled
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-xl border-2 ${status === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                status === 'complete' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                    'bg-white border-teal-100 text-teal-400 cursor-wait'
                }`}
        >
            {status === 'queued' || status === 'scanning' ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {message || 'Scanning...'}
                </>
            ) : status === 'complete' ? (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {message || 'Done'}
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {message || 'Error'}
                </>
            )}
        </button>
    );
}
