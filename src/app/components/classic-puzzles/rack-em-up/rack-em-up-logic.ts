import type { Side, Direction } from '../../../objects/game';
import { DIRECTION } from '../../../objects/game';

export const ROWS = 4;
export const COLS = 5;
export const LEFT_COL = 0;
export const RIGHT_COL = COLS - 1;
export const VISUAL_ROWS = ROWS + 2;
export const AUTO_SOLVE_MOVE_DELAY_MS = 450;

export type Cell = number | null;

export function idx(row: number, col: number): number {
  return row * COLS + col;
}

export function solvedCells(): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push(col === RIGHT_COL ? null : row);
    }
  }
  return cells;
}

export function canShiftState(plng: number, direction: Direction): boolean {
  return direction === DIRECTION.UP ? plng > -1 : plng < 1;
}

export function isSolvedState(cells: Cell[], plngl: number, plngr: number): boolean {
  if (plngl !== 0 || plngr !== 0) {
    return false;
  }

  for (let row = 0; row < ROWS; row++) {
    let rowColor: number | null = null;
    for (let col = 0; col < COLS; col++) {
      const value = cells[idx(row, col)];
      if (value === null) {
        continue;
      }
      if (rowColor === null) {
        rowColor = value;
      } else if (value !== rowColor) {
        return false;
      }
    }
  }

  return true;
}

export function applyTilt(cells: Cell[], plngl: number, plngr: number, direction: Side): Cell[] {
  const next = [...cells];
  const inBounds = (row: number) => row >= 0 && row < ROWS;

  let moved = true;
  while (moved) {
    moved = false;
    for (let row = 0; row < ROWS; row++) {
      const checkpoints: [number, number, number, number][] =
        direction === 'left'
          ? [
              [row - plngl, LEFT_COL, row, 1],
              [row, 1, row, 2],
              [row, 2, row, 3],
              [row, 3, row - plngr, RIGHT_COL],
            ]
          : [
              [row - plngr, RIGHT_COL, row, 3],
              [row, 3, row, 2],
              [row, 2, row, 1],
              [row, 1, row - plngl, LEFT_COL],
            ];

      for (const [tRow, tCol, nRow, nCol] of checkpoints) {
        if (!inBounds(tRow) || !inBounds(nRow)) {
          continue;
        }
        const tIdx = idx(tRow, tCol);
        const nIdx = idx(nRow, nCol);
        if (next[tIdx] === null && next[nIdx] !== null) {
          next[tIdx] = next[nIdx];
          next[nIdx] = null;
          moved = true;
        }
      }
    }
  }

  return next;
}
