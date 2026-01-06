import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface LobbyProps {
    onJoin: (username: string) => void;
    onFindGame: () => void;
    onCancelQueue: () => void;
    isJoined: boolean;
    isSearching: boolean;
    username: string;
    connected: boolean;
}

export function Lobby({
    onJoin,
    onFindGame,
    onCancelQueue,
    isJoined,
    isSearching,
    username,
    connected,
}: LobbyProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onJoin(inputValue.trim());
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 md:gap-8 w-full max-w-md px-4 md:px-0">
            <AnimatePresence mode="wait">
                {!isJoined ? (
                    <motion.form
                        key="join-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleSubmit}
                        className="w-full space-y-4"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter your username"
                                maxLength={20}
                                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
                            />
                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/20 to-gray-500/20 rounded-xl blur-xl" />
                        </div>
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || !connected}
                            className={cn(
                                "w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer",
                                "bg-gradient-to-r from-gray-700 to-gray-800 text-white",
                                "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                                "shadow-lg shadow-gray-900/50 border border-gray-600"
                            )}
                        >
                            Join Game
                        </button>
                    </motion.form>
                ) : (
                    <motion.div
                        key="matchmaking"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full text-center"
                    >
                        {!isSearching ? (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col items-center min-w-56">
                                    <span className="text-gray-200 text-lg">Playing as</span>
                                    <span className="text-2xl font-bold text-white">{username}</span>
                                </div>
                                <button
                                    onClick={onFindGame}
                                    className={cn(
                                        "px-8 py-3 rounded-xl font-semibold text-base transition-all cursor-pointer",
                                        "bg-gradient-to-r from-gray-700 to-gray-800 text-white text-2xl",
                                        "hover:opacity-90 shadow-lg shadow-gray-900/50 border border-gray-600"
                                    )}
                                >
                                    Play
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-3">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
                                    />
                                    <span className="text-lg text-gray-300">Searching for opponent...</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Bot will join if no player found in 10 seconds
                                </p>
                                <button
                                    onClick={onCancelQueue}
                                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!connected && (
                <div className="flex items-center gap-2 text-emerald-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm">Connecting to server...</span>
                </div>
            )}
        </div>
    );
}
