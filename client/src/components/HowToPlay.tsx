import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function HowToPlay() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 px-4 py-2 bg-gray-800/80 text-gray-300 rounded-full border border-gray-700 hover:bg-gray-700/80 transition-colors text-sm"
            >
                ❓
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4 text-center">
                                🎮 How to Play
                            </h2>

                            <div className="space-y-4 text-gray-300">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🎯</span>
                                    <div>
                                        <p className="font-medium text-white">Goal</p>
                                        <p className="text-sm">Connect 4 of your discs in a row (horizontal, vertical, or diagonal)</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🕹️</span>
                                    <div>
                                        <p className="font-medium text-white">How to Move</p>
                                        <p className="text-sm">Click any column to drop your disc. It falls to the lowest empty spot.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🎨</span>
                                    <div>
                                        <p className="font-medium text-white">Player Colors</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
                                            <span className="text-sm">Player 1 (Green)</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500" />
                                            <span className="text-sm">Player 2 (Gray)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🤖</span>
                                    <div>
                                        <p className="font-medium text-white">Matchmaking</p>
                                        <p className="text-sm">Wait for another player, or play against a bot after 10 seconds!</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🔄</span>
                                    <div>
                                        <p className="font-medium text-white">Reconnection</p>
                                        <p className="text-sm">Disconnected? You have 30 seconds to rejoin your game.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "w-full mt-6 py-3 rounded-xl font-semibold transition-all",
                                    "bg-gradient-to-r from-gray-700 to-gray-800 text-white",
                                    "hover:opacity-90 border border-gray-600"
                                )}
                            >
                                Got it!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
