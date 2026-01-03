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
        <div className="flex flex-col items-center gap-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
                <div className="relative grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, col) => (
                        <button
                            key={col}
                            onClick={() => !disabled && isYourTurn && onColumnClick(col)}
                            disabled={disabled || !isYourTurn}
                            className={cn(
                                "flex flex-col gap-2 p-1 rounded-lg transition-all duration-200",
                                isYourTurn && !disabled && "hover:bg-blue-400/30 cursor-pointer",
                                (!isYourTurn || disabled) && "cursor-not-allowed"
                            )}
                        >
                            {board.map((row, rowIdx) => (
                                <motion.div
                                    key={`${rowIdx}-${col}`}
                                    initial={row[col] !== 0 ? { y: -100, opacity: 0 } : false}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={cn(
                                        "w-12 h-12 md:w-14 md:h-14 rounded-full border-4 transition-all duration-300",
                                        row[col] === 0 && "bg-blue-900/50 border-blue-700/50",
                                        row[col] === 1 && "bg-gradient-to-br from-red-400 to-red-600 border-red-300 shadow-lg shadow-red-500/50",
                                        row[col] === 2 && "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-200 shadow-lg shadow-yellow-400/50",
                                        isWinningCell(rowIdx, col) && "ring-4 ring-white animate-pulse scale-110"
                                    )}
                                />
                            ))}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3 text-lg font-medium">
                <motion.div
                    animate={{ scale: currentPlayer === 1 ? 1.2 : 1, opacity: currentPlayer === 1 ? 1 : 0.5 }}
                    className={cn(
                        "w-8 h-8 rounded-full",
                        "bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-300"
                    )}
                />
                <span className="text-gray-400">vs</span>
                <motion.div
                    animate={{ scale: currentPlayer === 2 ? 1.2 : 1, opacity: currentPlayer === 2 ? 1 : 0.5 }}
                    className={cn(
                        "w-8 h-8 rounded-full",
                        "bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-yellow-200"
                    )}
                />
            </div>

            <p className={cn(
                "text-lg font-semibold transition-colors",
                isYourTurn ? "text-green-400" : "text-gray-400"
            )}>
                {isYourTurn ? "Your turn - click a column!" : "Waiting for opponent..."}
            </p>
        </div>
    );
}
