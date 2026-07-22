import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { InfoColumn } from '../../../objects/info';
import {
  AUTO_SOLVE_MOVE_DELAY_MS,
  COLS,
  Cell,
  LEFT_COL,
  RIGHT_COL,
  ROWS,
  VISUAL_ROWS,
  applyTilt,
  canShiftState,
  idx,
  isSolvedState,
  solvedCells,
} from './rack-em-up-logic';
import { SolverMove, solveRackEmUp } from './rack-em-up-solver';
import { DIRECTION, Direction, GAME_VIEW, GameView, Side, SIDE, SOLVER_STATE, SolverState } from '../../../objects/game';
import { RackEmUpLogoComponent } from './rack-em-up-logo/rack-em-up-logo';

type VisualKind = 'ball' | 'blank' | 'wall' | 'cap';

interface VisualCell {
  kind: VisualKind;
  color: number | null;
}

const INFO_COLUMNS: InfoColumn[] = [
  {
    h2: 'The moves', p: [
      { strong: 'Tilt (L / R)', text: 'slides every row\'s balls toward that side, gathering the gaps on the opposite side. This is the only move that actually relocates a ball.' },
      { strong: 'Shift (Ul / Ur / Dl / Dr)', text: 'the leftmost and rightmost columns are taller than the rest and can slide up or down one row, so each has three positions: up, centre, down. Shifting doesn\'t move any balls by itself, it just reconnects that edge column to a different row (you\'ll see a hatched wall appear where it\'s no longer lined up with a row). The <em>next</em> tilt is what actually carries a ball across, into, or out of the row it\'s now plugged into.' },
      { strong: 'Flip', text: 'turns the whole tray upside down. It doesn\'t rearrange anything relative to itself, just your view of it, so it\'s free and doesn\'t count as a move. It\'s mainly useful for reusing the same technique on rows you\'ve already solved once you flip them to the bottom.' },
    ]
  },
  {
    h2: 'Strategy', trivia: 'Ignoring shift position, there are 16!/4!<sup>4</sup> = 63,063,000 distinct arrangements of the balls, every one of them solvable!', p: [
      { text: 'Save the two outer rows for last, they\'re the hardest because there\'s no third edge column to help mix them. Start with the two middle rows instead: shift a column so it lines up with the row you want tilt to pull one matching ball across, then shift back and tilt again to slot it fully into place. Repeating this, one ball at a time, is usually enough to finish both middle rows.' },
      { text: 'For the outer rows, a shift-tilt-shift sequence lets you swap a piece sitting in an outer row\'s second slot with the corner piece next to it, without disturbing anything else. Repeat that swap until the row is solid. Once the bottom two rows are done, use <em>Flip</em> to bring the last row within reach and repeat the same trick.' },
    ]
  },
]

@Component({
  selector: 'app-rack-em-up',
  standalone: true,
  imports: [CommonModule, RackEmUpLogoComponent],
  templateUrl: './rack-em-up.html',
  styleUrl: './rack-em-up.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RackEmUpComponent implements OnDestroy {
  private initial = this.generateScrambled();
  private autoSolveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly GAME_VIEW = GAME_VIEW;
  readonly SOLVER_STATE = SOLVER_STATE;
  readonly INFO_COLUMNS = INFO_COLUMNS;

  view = signal<GameView>(GAME_VIEW.PLAY);
  cells = signal<Cell[]>(this.initial.cells);
  plngl = signal<number>(this.initial.plngl);
  plngr = signal<number>(this.initial.plngr);
  moves = signal<number>(0);
  solverState = signal<SolverState>(SOLVER_STATE.IDLE);
  showSolveConfirm = signal<boolean>(false);

  isLocked = computed<boolean>(() => this.solverState() !== SOLVER_STATE.IDLE);

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
    const plng = side === SIDE.LEFT ? this.plngl() : this.plngr();
    return canShiftState(plng, direction);
  }

  toggleView(): void {
    this.view.set(this.view() === GAME_VIEW.PLAY ? GAME_VIEW.INFO : GAME_VIEW.PLAY);
  }

  tilt(direction: Side): void {
    this.cells.set(applyTilt(this.cells(), this.plngl(), this.plngr(), direction));
    this.moves.update(count => count + 1);
  }

  shiftColumn(side: Side, direction: Direction): void {
    if (!this.canShift(side, direction)) {
      return;
    }

    const delta = direction === DIRECTION.UP ? -1 : 1;
    this.plngl.update(value => value + delta);
  
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
    this.solverState.set(SOLVER_STATE.IDLE);

    const state = this.generateScrambled();
    this.cells.set(state.cells);
    this.plngl.set(state.plngl);
    this.plngr.set(state.plngr);
    this.moves.set(0);
  }

  autoSolve(): void {
    if (this.solverState() !== SOLVER_STATE.IDLE || this.isSolved()) {
      return;
    }

    this.showSolveConfirm.set(true);
  }

  confirmAutoSolve(): void {
    this.showSolveConfirm.set(false);
    this.solverState.set(SOLVER_STATE.COMPUTING);

    // Defer so the "computing" state can render before the (possibly
    // heavy, synchronous) search runs.
    this.autoSolveTimer = setTimeout(() => {
      const moves = solveRackEmUp(this.cells(), this.plngl(), this.plngr());
      if (!moves || moves.length === 0) {
        this.solverState.set(SOLVER_STATE.DONE);
        return;
      }

      this.solverState.set(SOLVER_STATE.SOLVING);
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
      this.solverState.set(SOLVER_STATE.DONE);
      return;
    }

    const move = moves[index];
    if (move.kind === 'tilt') {
      this.tilt(move.direction);
    } else {
      this.shiftColumn(move.side, move.direction);
    }

    if (this.isSolved()) {
      this.solverState.set(SOLVER_STATE.DONE);
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
        cells = applyTilt(cells, plngl, plngr, Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT);
      } else {
        const side: Side = Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT;
        const direction: Direction = Math.random() < 0.5 ? DIRECTION.UP : DIRECTION.DOWN;
        const current = side === SIDE.LEFT ? plngl : plngr;
        const canShift = direction === DIRECTION.UP ? current > -1 : current < 1;
        if (canShift) {
          const delta = direction === DIRECTION.UP ? -1 : 1;
          plngr += delta;
          
        }
      }
    }

    return { cells, plngl, plngr };
  }
}
