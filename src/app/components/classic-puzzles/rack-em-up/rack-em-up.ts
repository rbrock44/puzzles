import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const ROWS = 4;
const COLS = 5;
const VISUAL_ROWS = ROWS + 2;
const LEFT_COL = 0;
const RIGHT_COL = COLS - 1;

type Cell = number | null;
type Side = 'left' | 'right';
type Direction = 'up' | 'down';
type VisualKind = 'ball' | 'blank' | 'wall' | 'cap';

interface VisualCell {
  kind: VisualKind;
  color: number | null;
}

@Component({
  selector: 'app-rack-em-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rack-em-up.html',
  styleUrl: './rack-em-up.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RackEmUpComponent {
  private initial = this.generateScrambled();

  view = signal<'play' | 'info'>('play');
  cells = signal<Cell[]>(this.initial.cells);
  plngl = signal<number>(this.initial.plngl);
  plngr = signal<number>(this.initial.plngr);
  moves = signal<number>(0);

  visualBoard = computed<VisualCell[][]>(() => {
    const cells = this.cells();
    const plngl = this.plngl();
    const plngr = this.plngr();
    const rows: VisualCell[][] = [];

    for (let vr = 0; vr < VISUAL_ROWS; vr++) {
      const row: VisualCell[] = [];
      for (let col = 0; col < COLS; col++) {
        if (col === LEFT_COL || col === RIGHT_COL) {
          const plng = col === LEFT_COL ? plngl : plngr;
          const dataRow = vr - plng - 1;
          if (dataRow >= 0 && dataRow < ROWS) {
            const value = cells[this.idx(dataRow, col)];
            row.push({ kind: value === null ? 'blank' : 'ball', color: value });
          } else {
            row.push({ kind: 'wall', color: null });
          }
        } else if (vr >= 1 && vr <= ROWS) {
          const dataRow = vr - 1;
          const value = cells[this.idx(dataRow, col)];
          row.push({ kind: value === null ? 'blank' : 'ball', color: value });
        } else {
          row.push({ kind: 'cap', color: null });
        }
      }
      rows.push(row);
    }

    return rows;
  });

  isSolved = computed<boolean>(() => {
    if (this.plngl() !== 0 || this.plngr() !== 0) {
      return false;
    }

    const cells = this.cells();
    for (let row = 0; row < ROWS; row++) {
      let rowColor: number | null = null;
      for (let col = 0; col < COLS; col++) {
        const value = cells[this.idx(row, col)];
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
  });

  canShift(side: Side, direction: Direction): boolean {
    const plng = side === 'left' ? this.plngl() : this.plngr();
    return direction === 'up' ? plng > -1 : plng < 1;
  }

  toggleView(): void {
    this.view.set(this.view() === 'play' ? 'info' : 'play');
  }

  tilt(direction: Side): void {
    this.cells.set(this.applyTilt(this.cells(), this.plngl(), this.plngr(), direction));
    this.moves.update(count => count + 1);
  }

  shiftColumn(side: Side, direction: Direction): void {
    if (!this.canShift(side, direction)) {
      return;
    }

    const delta = direction === 'up' ? -1 : 1;
    if (side === 'left') {
      this.plngl.update(value => value + delta);
    } else {
      this.plngr.update(value => value + delta);
    }
    this.moves.update(count => count + 1);
  }

  flip(): void {
    const cells = this.cells();
    const next = [...cells];
    for (let i = 0; i < cells.length / 2; i++) {
      const j = next[i];
      next[i] = next[cells.length - 1 - i];
      next[cells.length - 1 - i] = j;
    }
    this.cells.set(next);

    const plngl = this.plngl();
    const plngr = this.plngr();
    this.plngl.set(-plngr);
    this.plngr.set(-plngl);
  }

  newGame(): void {
    const state = this.generateScrambled();
    this.cells.set(state.cells);
    this.plngl.set(state.plngl);
    this.plngr.set(state.plngr);
    this.moves.set(0);
  }

  private idx(row: number, col: number): number {
    return row * COLS + col;
  }

  private solvedCells(): Cell[] {
    const cells: Cell[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        cells.push(col === RIGHT_COL ? null : row);
      }
    }
    return cells;
  }

  private applyTilt(cells: Cell[], plngl: number, plngr: number, direction: Side): Cell[] {
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
          const tIdx = this.idx(tRow, tCol);
          const nIdx = this.idx(nRow, nCol);
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

  private generateScrambled(): { cells: Cell[]; plngl: number; plngr: number } {
    let cells = this.solvedCells();
    let plngl = 0;
    let plngr = 0;

    for (let i = 0; i < 300; i++) {
      if (Math.random() < 0.4) {
        cells = this.applyTilt(cells, plngl, plngr, Math.random() < 0.5 ? 'left' : 'right');
      } else {
        const side: Side = Math.random() < 0.5 ? 'left' : 'right';
        const direction: Direction = Math.random() < 0.5 ? 'up' : 'down';
        const current = side === 'left' ? plngl : plngr;
        const canShift = direction === 'up' ? current > -1 : current < 1;
        if (canShift) {
          const delta = direction === 'up' ? -1 : 1;
          if (side === 'left') {
            plngl += delta;
          } else {
            plngr += delta;
          }
        }
      }
    }

    return { cells, plngl, plngr };
  }
}
