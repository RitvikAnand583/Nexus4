import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

interface GameResultProps {
    winner: string | null;
    username: string;
    opponent: string;
    result: 'win' | 'draw' | 'forfeit';
    duration: number;
    onPlayAgain: () => void;
}

interface Confetti {
    id: number;
    x: number;
    delay: number;
    color: string;
}

export function GameResult({
    winner,
    username,
    opponent,
    result,
    duration,
    onPlayAgain,
}: GameResultProps) {
    const isWin = winner === username;
    const isDraw = winner === null && result === 'draw';
    const isForfeit = result === 'forfeit';
    const [confetti, setConfetti] = useState<Confetti[]>([]);

    useEffect(() => {
        if (isWin) {
            const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fff'];
            const newConfetti = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setConfetti(newConfetti);
        }
    }, [isWin]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const shakeVariants = {
        shake: {
            x: [0, -10, 10, -10, 10, -5, 5, 0],
            transition: { duration: 0.5 }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden"
        >
            {isWin && confetti.map((c) => (
                <motion.div
                    key={c.id}
                    initial={{ y: -20, x: `${c.x}vw`, opacity: 1 }}
                    animate={{ y: '100vh', opacity: 0 }}
                    transition={{ duration: 2 + Math.random(), delay: c.delay, ease: 'linear' }}
                    className="fixed top-0 w-3 h-3 rounded-sm"
                    style={{ backgroundColor: c.color, left: 0 }}
                />
            ))}

            <motion.div
                initial={{ y: 50 }}
                animate={!isWin && !isDraw ? 'shake' : { y: 0 }}
                variants={shakeVariants}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700 relative"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center mb-6"
                >
                    <motion.span
                        className="text-6xl inline-block"
                        animate={isWin ? {
                            rotate: [0, -10, 10, -10, 10, 0],
                            scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {isWin ? '🏆' : isDraw ? '🤝' : '😔'}
                    </motion.span>
                </motion.div>

                <h2 className={cn(
                    "text-3xl font-bold text-center mb-2",
                    isWin && "text-emerald-400",
                    isDraw && "text-gray-300",
                    !isWin && !isDraw && "text-red-400"
                )}>
                    {isWin ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
                </h2>

                <p className="text-gray-400 text-center mb-6">
                    {isWin && `You defeated ${opponent}!`}
                    {isDraw && `Well played against ${opponent}!`}
                    {!isWin && !isDraw && (isForfeit ? `${winner} wins by forfeit` : `${opponent} wins!`)}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                        <p className="text-gray-400 text-sm">Duration</p>
                        <p className="text-white font-bold text-lg">{formatDuration(duration)}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                        <p className="text-gray-400 text-sm">Result</p>
                        <p className={cn(
                            "font-bold text-lg capitalize",
                            isWin && "text-emerald-400",
                            isDraw && "text-gray-300",
                            !isWin && !isDraw && "text-red-400"
                        )}>
                            {result}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onPlayAgain}
                    className={cn(
                        "w-full py-3 rounded-xl font-semibold text-lg transition-all",
                        "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white",
                        "hover:opacity-90 shadow-lg shadow-emerald-500/25"
                    )}
                >
                    Play Again
                </button>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 text-center"
                >
                    <p className="text-gray-500 text-sm">
                        {isWin ? 'Win +1' : isDraw ? 'Draw 0' : 'Loss -1'} recorded
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
