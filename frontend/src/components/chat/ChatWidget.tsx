'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatApi } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    title: string;
    createdAt: string;
}

export default function ChatWidget() {
    const { user, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Initial Load
    const loadConversations = useCallback(async () => {
        if (!user) return;
        try {
            const data = await chatApi.getConversations();
            setConversations(data);
            if (data.length > 0 && !activeConversation) {
                // Don't auto-select on widget load to save resources, wait for open? 
                // Actually, let's select the most recent one so it's ready.
                setActiveConversation(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    }, [user, activeConversation]);

    const loadMessages = useCallback(async (id: string) => {
        try {
            const data = await chatApi.getMessages(id);
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Socket Connection
    useEffect(() => {
        if (!user || !token || !isOpen) return; // Only connect when widget is open

        if (!socketRef.current) {
            const socket = io(apiUrl, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
            });
            socketRef.current = socket;

            socket.on('connect', () => console.log('Chat Connected'));
            socket.on('newMessage', (message: Message) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                if (message.role === 'assistant') setLoading(false);
            });
        }

        return () => {
            // Optional: Disconnect on close if we want to save resources, 
            // but keeping it open might be better for UX. 
            // For now, let's keep it alive while mounted.
        };
    }, [user, token, isOpen]);

    // Join Room
    useEffect(() => {
        if (!activeConversation || !socketRef.current) return;
        const socket = socketRef.current;
        if (socket.connected) {
            socket.emit('joinConversation', activeConversation);
        } else {
            socket.once('connect', () => socket.emit('joinConversation', activeConversation));
        }
        loadMessages(activeConversation);
    }, [activeConversation, loadMessages, isOpen]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && user) loadConversations();
    }, [isOpen, user, loadConversations]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socketRef.current) return;

        let currentConvId = activeConversation;

        // Create new conversation if none exists
        if (!currentConvId) {
            try {
                const newConv = await chatApi.createConversation();
                setConversations([newConv, ...conversations]);
                setActiveConversation(newConv.id);
                currentConvId = newConv.id;
            } catch (err) {
                console.error(err);
                return;
            }
        }

        setLoading(true);
        socketRef.current.emit('sendMessage', {
            conversationId: currentConvId,
            content: input
        });
        setInput('');
    };

    const handleNewChat = async () => {
        try {
            const newConv = await chatApi.createConversation();
            setConversations([newConv, ...conversations]);
            setActiveConversation(newConv.id);
        } catch (err) { console.error(err); }
    };

    if (!user) return null; // Don't show if not logged in

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Widget Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 bg-teal-600 text-white flex justify-between items-center bg-gradient-to-r from-teal-600 to-teal-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <span className="text-sm">🤖</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Housing Advisor</h3>
                                <p className="text-xs text-teal-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={handleNewChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="New Chat">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="mt-8 text-center px-6">
                                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👋</div>
                                <h4 className="font-bold text-slate-800 mb-2">Hello!</h4>
                                <p className="text-sm text-slate-500">I can help you find listings, write applications, or answer questions about German housing laws.</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${msg.role === 'user'
                                            ? 'bg-teal-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-sm transition-all placeholder:text-slate-400"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-teal-600 hover:bg-teal-500'
                    } text-white`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                )}
            </button>
        </div>
    );
}
