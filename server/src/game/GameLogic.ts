

export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];

export const ROWS = 6;
export const COLS = 7;
export const WIN_LENGTH = 4;


export function createEmptyBoard(): Board {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}


export function dropDisc(board: Board, col: number, player: Player): number {
    if (col < 0 || col >= COLS) return -1;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
            board[row][col] = player;
            return row;
        }
    }

    return -1;
}


export function isColumnValid(board: Board, col: number): boolean {
    return col >= 0 && col < COLS && board[0][col] === 0;
}


export function checkWinner(board: Board, row: number, col: number): Player | null {
    const player = board[row][col] as Player;
    if (!player) return null;

    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
    ];

    for (const [dr, dc] of directions) {
        const cells = getLineOfFour(board, row, col, dr, dc, player);
        if (cells.length >= WIN_LENGTH) {
            return player;
        }
    }

    return null;
}


export function getWinningCells(board: Board, row: number, col: number): [number, number][] {
    const player = board[row][col] as Player;
    if (!player) return [];

    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
    ];

    for (const [dr, dc] of directions) {
        const cells = getLineOfFour(board, row, col, dr, dc, player);
        if (cells.length >= WIN_LENGTH) {
            return cells;
        }
    }

    return [];
}

function getLineOfFour(
    board: Board,
    row: number,
    col: number,
    dr: number,
    dc: number,
    player: Player
): [number, number][] {
    const cells: [number, number][] = [[row, col]];

    for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            cells.push([r, c]);
        } else {
            break;
        }
    }

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

export function isBoardFull(board: Board): boolean {
    return board[0].every(cell => cell !== 0);
}


export function getValidColumns(board: Board): number[] {
    const valid: number[] = [];
    for (let col = 0; col < COLS; col++) {
        if (isColumnValid(board, col)) {
            valid.push(col);
        }
    }
    return valid;
}


export function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
}


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
