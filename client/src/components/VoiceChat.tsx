import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

type VoiceChatState = 'idle' | 'requesting' | 'incoming' | 'connected' | 'declined';

interface VoiceChatProps {
    opponent: string;
    onRequest: () => void;
    onAccept: () => void;
    onDecline: () => void;
    state: VoiceChatState;
    isMuted: boolean;
    onToggleMute: () => void;
}

const ACCEPT_TIMEOUT = 15;

export function VoiceChat({
    opponent,
    onRequest,
    onAccept,
    onDecline,
    state,
    isMuted,
    onToggleMute,
}: VoiceChatProps) {
    const [timeLeft, setTimeLeft] = useState(ACCEPT_TIMEOUT);

    // Timer for incoming request
    useEffect(() => {
        if (state !== 'incoming') {
            setTimeLeft(ACCEPT_TIMEOUT);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onDecline();
                    return ACCEPT_TIMEOUT;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state, onDecline]);

    return (
        <>
            <div className="relative">
                {/* Request Button - shown when idle */}
                {state === 'idle' && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onRequest}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                            "bg-gray-700/80 text-gray-300 border border-gray-600",
                            "hover:bg-gray-600/80 hover:text-white"
                        )}
                    >
                        🎤 Voice
                    </motion.button>
                )}

                {/* Requesting state */}
                {state === 'requesting' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-3 py-1.5 rounded-lg text-sm bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                    >
                        ⏳ Waiting...
                    </motion.div>
                )}

                {/* Declined state */}
                {state === 'declined' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-3 py-1.5 rounded-lg text-sm bg-red-900/50 text-red-300 border border-red-700"
                    >
                        ❌ Declined
                    </motion.div>
                )}

                {/* Connected state - Mute button */}
                {state === 'connected' && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={onToggleMute}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                            isMuted
                                ? "bg-red-900/50 text-red-300 border border-red-700"
                                : "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                        )}
                    >
                        {isMuted ? '🔇 Muted' : '🎤 Live'}
                    </motion.button>
                )}
            </div>

            {/* Incoming request popup - CENTERED */}
            <AnimatePresence>
                {state === 'incoming' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-800 border border-gray-600 rounded-xl p-6 shadow-2xl min-w-72"
                        >
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-3">🎤</div>
                                <p className="text-white text-lg mb-1">
                                    <span className="font-semibold">{opponent}</span>
                                </p>
                                <p className="text-gray-400 text-sm">wants to voice chat</p>
                            </div>

                            {/* Timer */}
                            <div className="flex justify-center mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2",
                                    timeLeft <= 5
                                        ? "text-red-400 border-red-500"
                                        : "text-gray-300 border-gray-600"
                                )}>
                                    {timeLeft}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onAccept}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={onDecline}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gray-600 text-white hover:bg-gray-500 transition-colors cursor-pointer"
                                >
                                    Decline
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
