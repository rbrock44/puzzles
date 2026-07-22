import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Cell,
  COLS,
  Direction,
  LEFT_COL,
  ROWS,
  RIGHT_COL,
  Side,
  applyTilt,
  canShiftState,
  idx,
  isSolvedState,
  solvedCells,
} from './rack-em-up-logic';
import { SolverMove, solveRackEmUp } from './rack-em-up-solver';

const VISUAL_ROWS = ROWS + 2;
const AUTO_SOLVE_MOVE_DELAY_MS = 450;

type VisualKind = 'ball' | 'blank' | 'wall' | 'cap';
type SolverState = 'idle' | 'computing' | 'solving' | 'done';

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
export class RackEmUpComponent implements OnDestroy {
  private initial = this.generateScrambled();
  private autoSolveTimer: ReturnType<typeof setTimeout> | null = null;

  view = signal<'play' | 'info'>('play');
  cells = signal<Cell[]>(this.initial.cells);
  plngl = signal<number>(this.initial.plngl);
  plngr = signal<number>(this.initial.plngr);
  moves = signal<number>(0);
  solverState = signal<SolverState>('idle');
  showSolveConfirm = signal<boolean>(false);

  isLocked = computed<boolean>(() => this.solverState() !== 'idle');

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
            const value = cells[idx(dataRow, col)];
            row.push({ kind: value === null ? 'blank' : 'ball', color: value });
          } else {
            row.push({ kind: 'wall', color: null });
          }
        } else if (vr >= 1 && vr <= ROWS) {
          const dataRow = vr - 1;
          const value = cells[idx(dataRow, col)];
          row.push({ kind: value === null ? 'blank' : 'ball', color: value });
        } else {
          row.push({ kind: 'cap', color: null });
        }
      }
      rows.push(row);
    }

    return rows;
  });

  isSolved = computed<boolean>(() => isSolvedState(this.cells(), this.plngl(), this.plngr()));

  canShift(side: Side, direction: Direction): boolean {
    const plng = side === 'left' ? this.plngl() : this.plngr();
    return canShiftState(plng, direction);
  }

  toggleView(): void {
    this.view.set(this.view() === 'play' ? 'info' : 'play');
  }

  tilt(direction: Side): void {
    this.cells.set(applyTilt(this.cells(), this.plngl(), this.plngr(), direction));
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
    this.clearAutoSolveTimer();
    this.solverState.set('idle');

    const state = this.generateScrambled();
    this.cells.set(state.cells);
    this.plngl.set(state.plngl);
    this.plngr.set(state.plngr);
    this.moves.set(0);
  }

  autoSolve(): void {
    if (this.solverState() !== 'idle' || this.isSolved()) {
      return;
    }

    this.showSolveConfirm.set(true);
  }

  confirmAutoSolve(): void {
    this.showSolveConfirm.set(false);
    this.solverState.set('computing');

    // Defer so the "computing" state can render before the (possibly
    // heavy, synchronous) search runs.
    this.autoSolveTimer = setTimeout(() => {
      const moves = solveRackEmUp(this.cells(), this.plngl(), this.plngr());
      if (!moves || moves.length === 0) {
        this.solverState.set('done');
        return;
      }

      this.solverState.set('solving');
      this.playSolution(moves, 0);
    }, 0);
  }

  cancelAutoSolve(): void {
    this.showSolveConfirm.set(false);
  }

  ngOnDestroy(): void {
    this.clearAutoSolveTimer();
  }

  private playSolution(moves: SolverMove[], index: number): void {
    if (index >= moves.length) {
      this.solverState.set('done');
      return;
    }

    const move = moves[index];
    if (move.kind === 'tilt') {
      this.tilt(move.direction);
    } else {
      this.shiftColumn(move.side, move.direction);
    }

    if (this.isSolved()) {
      this.solverState.set('done');
      return;
    }

    this.autoSolveTimer = setTimeout(() => {
      this.playSolution(moves, index + 1);
    }, AUTO_SOLVE_MOVE_DELAY_MS);
  }

  private clearAutoSolveTimer(): void {
    if (this.autoSolveTimer !== null) {
      clearTimeout(this.autoSolveTimer);
      this.autoSolveTimer = null;
    }
  }

  private generateScrambled(): { cells: Cell[]; plngl: number; plngr: number } {
    let cells = solvedCells();
    let plngl = 0;
    let plngr = 0;

    for (let i = 0; i < 300; i++) {
      if (Math.random() < 0.4) {
        cells = applyTilt(cells, plngl, plngr, Math.random() < 0.5 ? 'left' : 'right');
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
