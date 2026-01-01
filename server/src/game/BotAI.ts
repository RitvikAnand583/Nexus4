import {
    Board,
    Player,
    ROWS,
    COLS,
    WIN_LENGTH,
    cloneBoard,
    dropDisc,
    checkWinner,
    getValidColumns,
} from './GameLogic.js';

export function getBotMove(board: Board, botPlayer: Player): number {
    const opponent: Player = botPlayer === 1 ? 2 : 1;
    const validCols = getValidColumns(board);

    if (validCols.length === 0) return -1;

    for (const col of validCols) {
        if (canWinWithMove(board, col, botPlayer)) {
            return col;
        }
    }

    for (const col of validCols) {
        if (canWinWithMove(board, col, opponent)) {
            return col;
        }
    }

    const blockMove = findTwoWayBlockMove(board, opponent);
    if (blockMove !== -1 && validCols.includes(blockMove)) {
        return blockMove;
    }
    const setupMove = findTwoWaySetupMove(board, botPlayer);
    if (setupMove !== -1 && validCols.includes(setupMove)) {
        return setupMove;
    }
    const centerPreference = [3, 2, 4, 1, 5, 0, 6];
    for (const col of centerPreference) {
        if (validCols.includes(col) && !createsOpponentWin(board, col, botPlayer, opponent)) {
            return col;
        }
    }

    for (const col of validCols) {
        if (!createsOpponentWin(board, col, botPlayer, opponent)) {
            return col;
        }
    }

    return validCols[0];
}

function canWinWithMove(board: Board, col: number, player: Player): boolean {
    const testBoard = cloneBoard(board);
    const row = dropDisc(testBoard, col, player);
    if (row === -1) return false;
    return checkWinner(testBoard, row, col) === player;
}

function createsOpponentWin(board: Board, col: number, botPlayer: Player, opponent: Player): boolean {
    const testBoard = cloneBoard(board);
    const row = dropDisc(testBoard, col, botPlayer);
    if (row === -1) return true;

    if (row > 0) {
        const opponentRow = row - 1;
        testBoard[opponentRow][col] = opponent;
        if (checkWinner(testBoard, opponentRow, col) === opponent) {
            return true;
        }
    }
    return false;
}

function findTwoWaySetupMove(board: Board, player: Player): number {
    const validCols = getValidColumns(board);

    for (const col of validCols) {
        const testBoard = cloneBoard(board);
        const row = dropDisc(testBoard, col, player);
        if (row === -1) continue;

        let winningMoves = 0;
        for (const nextCol of getValidColumns(testBoard)) {
            if (canWinWithMove(testBoard, nextCol, player)) {
                winningMoves++;
            }
        }

        if (winningMoves >= 2) {
            return col;
        }
    }
    return -1;
}

function findTwoWayBlockMove(board: Board, opponent: Player): number {
    const validCols = getValidColumns(board);

    for (const col of validCols) {
        const testBoard = cloneBoard(board);
        const row = dropDisc(testBoard, col, opponent);
        if (row === -1) continue;

        let winningMoves = 0;
        for (const nextCol of getValidColumns(testBoard)) {
            if (canWinWithMove(testBoard, nextCol, opponent)) {
                winningMoves++;
            }
        }

        if (winningMoves >= 2) {
            return col;
        }
    }
    return -1;
}

function countConsecutive(board: Board, row: number, col: number, dr: number, dc: number, player: Player): number {
    let count = 0;
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
    }
    return count;
}
