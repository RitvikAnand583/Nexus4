import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GameResultProps {
    winner: string | null;
    username: string;
    opponent: string;
    result: 'win' | 'draw' | 'forfeit';
    duration: number;
    onPlayAgain: () => void;
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

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center mb-6"
                >
                    <span className="text-6xl">
                        {isWin ? '🏆' : isDraw ? '🤝' : '😔'}
                    </span>
                </motion.div>

                <h2 className={cn(
                    "text-3xl font-bold text-center mb-2",
                    isWin && "text-green-400",
                    isDraw && "text-yellow-400",
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
                            isWin && "text-green-400",
                            isDraw && "text-yellow-400",
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
                        "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
                        "hover:opacity-90 shadow-lg shadow-blue-500/25"
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
                        {isWin ? '+1 Win' : isDraw ? '+1 Draw' : '+1 Loss'} added to your stats
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
