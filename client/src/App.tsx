import { useState } from 'react';
import { GameBoard } from './components/GameBoard';

type Cell = 0 | 1 | 2;
type Board = Cell[][];

const createEmptyBoard = (): Board =>
    Array(6).fill(null).map(() => Array(7).fill(0));

function App() {
    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);

    const handleColumnClick = (col: number) => {
        const newBoard = board.map(row => [...row]);
        for (let row = 5; row >= 0; row--) {
            if (newBoard[row][col] === 0) {
                newBoard[row][col] = currentPlayer;
                setBoard(newBoard);
                setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
                break;
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Nexus4
            </h1>
            <GameBoard
                board={board}
                onColumnClick={handleColumnClick}
                currentPlayer={currentPlayer}
                yourPlayer={1}
                isYourTurn={true}
                winningCells={[]}
            />
            <button
                onClick={() => {
                    setBoard(createEmptyBoard());
                    setCurrentPlayer(1);
                }}
                className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
                Reset Game
            </button>
        </div>
    );
}

export default App;
