// Game Logic for Four in a Row (Connect Four)
// 7 columns × 6 rows grid

export type Player = 1 | 2;
export type Cell = 0 | Player; // 0 = empty, 1 = player1, 2 = player2
export type Board = Cell[][];

export const ROWS = 6;
export const COLS = 7;
export const WIN_LENGTH = 4;

/**
 * Creates an empty game board
 */
export function createEmptyBoard(): Board {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

/**
 * Drops a disc into a column
 * @returns The row where the disc landed, or -1 if column is full
 */
export function dropDisc(board: Board, col: number, player: Player): number {
    if (col < 0 || col >= COLS) return -1;

    // Find the lowest empty row in this column
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
            board[row][col] = player;
            return row;
        }
    }

    return -1; // Column is full
}

/**
 * Checks if a column has space for more discs
 */
export function isColumnValid(board: Board, col: number): boolean {
    return col >= 0 && col < COLS && board[0][col] === 0;
}

/**
 * Checks for a winner after a move
 * @returns The winning player (1 or 2), or null if no winner
 */
export function checkWinner(board: Board, row: number, col: number): Player | null {
    const player = board[row][col] as Player;
    if (!player) return null;

    // Check all four directions: horizontal, vertical, and both diagonals
    const directions = [
        [0, 1],   // Horizontal →
        [1, 0],   // Vertical ↓
        [1, 1],   // Diagonal ↘
        [1, -1],  // Diagonal ↙
    ];

    for (const [dr, dc] of directions) {
        const cells = getLineOfFour(board, row, col, dr, dc, player);
        if (cells.length >= WIN_LENGTH) {
            return player;
        }
    }

    return null;
}

/**
 * Gets the winning cells if there's a winner
 */
export function getWinningCells(board: Board, row: number, col: number): [number, number][] {
    const player = board[row][col] as Player;
    if (!player) return [];

    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal ↘
        [1, -1],  // Diagonal ↙
    ];

    for (const [dr, dc] of directions) {
        const cells = getLineOfFour(board, row, col, dr, dc, player);
        if (cells.length >= WIN_LENGTH) {
            return cells;
        }
    }

    return [];
}

/**
 * Gets connected cells in a line (both directions from the placed piece)
 */
function getLineOfFour(
    board: Board,
    row: number,
    col: number,
    dr: number,
    dc: number,
    player: Player
): [number, number][] {
    const cells: [number, number][] = [[row, col]];

    // Count in positive direction
    for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            cells.push([r, c]);
        } else {
            break;
        }
    }

    // Count in negative direction
    for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            cells.push([r, c]);
        } else {
            break;
        }
    }

    return cells;
}

/**
 * Checks if the board is full (draw)
 */
export function isBoardFull(board: Board): boolean {
    return board[0].every(cell => cell !== 0);
}

/**
 * Gets all valid columns for placing a disc
 */
export function getValidColumns(board: Board): number[] {
    const valid: number[] = [];
    for (let col = 0; col < COLS; col++) {
        if (isColumnValid(board, col)) {
            valid.push(col);
        }
    }
    return valid;
}

/**
 * Creates a deep copy of the board
 */
export function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
}

/**
 * Prints the board to console (for debugging)
 */
export function printBoard(board: Board): void {
    console.log('\n  0 1 2 3 4 5 6');
    console.log('  ─────────────');
    for (let row = 0; row < ROWS; row++) {
        const rowStr = board[row].map(cell =>
            cell === 0 ? '·' : cell === 1 ? '●' : '○'
        ).join(' ');
        console.log(`${row}|${rowStr}|`);
    }
    console.log('  ─────────────\n');
}
