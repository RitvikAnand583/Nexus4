import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type Cell = 0 | 1 | 2;
type Board = Cell[][];

interface GameBoardProps {
    board: Board;
    onColumnClick: (col: number) => void;
    currentPlayer: 1 | 2;
    yourPlayer: 1 | 2;
    isYourTurn: boolean;
    winningCells: [number, number][];
    disabled?: boolean;
}

export function GameBoard({
    board,
    onColumnClick,
    currentPlayer,
    yourPlayer,
    isYourTurn,
    winningCells,
    disabled = false,
}: GameBoardProps) {
    const isWinningCell = (row: number, col: number) =>
        winningCells.some(([r, c]) => r === row && c === col);

    return (
        <div className="flex flex-col items-center gap-4 md:gap-6">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/30 to-gray-700/30 rounded-3xl blur-sm" />
                <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-2 md:p-3 rounded-2xl border border-gray-700 shadow-2xl">
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {Array.from({ length: 7 }).map((_, col) => (
                            <button
                                key={col}
                                onClick={() => !disabled && isYourTurn && onColumnClick(col)}
                                disabled={disabled || !isYourTurn}
                                className={cn(
                                    "flex flex-col gap-1 md:gap-2 p-0.5 md:p-1 rounded-xl transition-all duration-200",
                                    isYourTurn && !disabled && "hover:bg-emerald-900/30 cursor-pointer",
                                    (!isYourTurn || disabled) && "cursor-not-allowed"
                                )}
                            >
                                {board.map((row, rowIdx) => (
                                    <motion.div
                                        key={`${rowIdx}-${col}`}
                                        initial={row[col] !== 0 ? { y: -80, opacity: 0 } : false}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={cn(
                                            "w-10 h-10 md:w-14 md:h-14 rounded-full transition-all duration-200",
                                            row[col] === 0 && "bg-gray-950 border-2 border-gray-800 shadow-inner",
                                            row[col] === 1 && "bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-300 shadow-lg shadow-emerald-500/40",
                                            row[col] === 2 && "bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-200 shadow-lg shadow-gray-400/40",
                                            isWinningCell(rowIdx, col) && "ring-2 ring-white ring-offset-2 ring-offset-gray-900 animate-pulse scale-105"
                                        )}
                                    />
                                ))}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ scale: currentPlayer === 1 ? 1.15 : 1, opacity: currentPlayer === 1 ? 1 : 0.4 }}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-300"
                    />
                    <span className={cn(
                        "text-sm font-medium",
                        currentPlayer === 1 ? "text-white" : "text-gray-500"
                    )}>
                        {yourPlayer === 1 ? "You" : "Opponent"}
                    </span>
                </div>
                <span className="text-gray-600">vs</span>
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ scale: currentPlayer === 2 ? 1.15 : 1, opacity: currentPlayer === 2 ? 1 : 0.4 }}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-200"
                    />
                    <span className={cn(
                        "text-sm font-medium",
                        currentPlayer === 2 ? "text-white" : "text-gray-500"
                    )}>
                        {yourPlayer === 2 ? "You" : "Opponent"}
                    </span>
                </div>
            </div>

            <motion.div
                animate={isYourTurn ? {
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0)', '0 0 20px 10px rgba(16, 185, 129, 0.3)', '0 0 0 0 rgba(16, 185, 129, 0)']
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                    "px-6 py-3 rounded-2xl font-semibold text-lg transition-all",
                    isYourTurn
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-2 border-emerald-400"
                        : "bg-gray-800/50 text-gray-400 border border-gray-700"
                )}
            >
                {isYourTurn ? " Your Turn!" : " Waiting..."}
            </motion.div>
        </div>
    );
}
