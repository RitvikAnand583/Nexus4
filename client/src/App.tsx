import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameResult as GameResultModal } from './components/GameResult';

type Cell = 0 | 1 | 2;
type Board = Cell[][];
type GameState = 'lobby' | 'searching' | 'playing' | 'gameOver';

interface GameData {
    gameId: string;
    board: Board;
    currentPlayer: 1 | 2;
    yourPlayer: 1 | 2;
    opponent: string;
    isOpponentBot: boolean;
}

interface GameResult {
    winner: string | null;
    result: 'win' | 'draw' | 'forfeit';
    winningCells: [number, number][];
    duration: number;
}

function App() {
    const { connected, lastMessage, send } = useWebSocket();
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [username, setUsername] = useState('');
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (!lastMessage) return;

        switch (lastMessage.type) {
            case 'joined':
                setUsername(lastMessage.username);
                break;

            case 'queued':
                setGameState('searching');
                break;

            case 'queueCancelled':
                setGameState('lobby');
                break;

            case 'gameStart':
                setGameState('playing');
                setGameResult(null);
                setShowResult(false);
                setGameData({
                    gameId: lastMessage.gameId,
                    board: lastMessage.board,
                    currentPlayer: lastMessage.currentPlayer,
                    yourPlayer: lastMessage.yourPlayer,
                    opponent: lastMessage.opponent,
                    isOpponentBot: lastMessage.isOpponentBot,
                });
                break;

            case 'move':
                setGameData(prev => prev ? {
                    ...prev,
                    board: lastMessage.board,
                    currentPlayer: lastMessage.currentPlayer,
                } : null);
                break;

            case 'gameOver':
                setGameState('gameOver');
                setGameData(prev => prev ? { ...prev, board: lastMessage.board } : null);
                setGameResult({
                    winner: lastMessage.winner,
                    result: lastMessage.result,
                    winningCells: lastMessage.winningCells || [],
                    duration: lastMessage.duration || 0,
                });
                setTimeout(() => setShowResult(true), 1500);
                break;

            case 'reconnected':
                setGameState('playing');
                setGameData({
                    gameId: lastMessage.gameId,
                    board: lastMessage.board,
                    currentPlayer: lastMessage.currentPlayer,
                    yourPlayer: lastMessage.yourPlayer,
                    opponent: lastMessage.opponent,
                    isOpponentBot: lastMessage.isOpponentBot,
                });
                break;

            case 'opponentDisconnected':
                break;

            case 'opponentReconnected':
                break;

            case 'error':
                console.error('Server error:', lastMessage.message);
                break;
        }
    }, [lastMessage]);

    const handleJoin = (name: string) => {
        send({ type: 'join', username: name });
        setUsername(name);
    };

    const handleFindGame = () => {
        send({ type: 'findGame' });
    };

    const handleCancelQueue = () => {
        send({ type: 'cancelQueue' });
    };

    const handleColumnClick = (column: number) => {
        if (gameData && gameData.currentPlayer === gameData.yourPlayer) {
            send({ type: 'move', column });
        }
    };

    const handlePlayAgain = () => {
        setGameState('lobby');
        setGameData(null);
        setGameResult(null);
    };

    const isYourTurn = gameData ? gameData.currentPlayer === gameData.yourPlayer : false;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex flex-col items-center justify-center p-8">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-gray-400">
                Nexus4
            </h1>

            {(gameState === 'lobby' || gameState === 'searching') && (
                <Lobby
                    onJoin={handleJoin}
                    onFindGame={handleFindGame}
                    onCancelQueue={handleCancelQueue}
                    isJoined={!!username}
                    isSearching={gameState === 'searching'}
                    username={username}
                    connected={connected}
                />
            )}

            {(gameState === 'playing' || gameState === 'gameOver') && gameData && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 text-gray-300 mb-4">
                        <span className="font-semibold text-white">{username}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-semibold text-white">
                            {gameData.opponent}
                            {gameData.isOpponentBot && ' 🤖'}
                        </span>
                    </div>

                    <GameBoard
                        board={gameData.board}
                        onColumnClick={handleColumnClick}
                        currentPlayer={gameData.currentPlayer}
                        yourPlayer={gameData.yourPlayer}
                        isYourTurn={isYourTurn && gameState === 'playing'}
                        winningCells={gameResult?.winningCells || []}
                        disabled={gameState === 'gameOver'}
                    />

                    {gameState === 'gameOver' && showResult && gameResult && gameData && (
                        <GameResultModal
                            winner={gameResult.winner}
                            username={username}
                            opponent={gameData.opponent}
                            result={gameResult.result}
                            duration={gameResult.duration}
                            onPlayAgain={handlePlayAgain}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
