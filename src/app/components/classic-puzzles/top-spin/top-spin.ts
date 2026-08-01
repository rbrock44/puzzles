import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { InfoColumn } from '../../../objects/info';
import { GAME_VIEW, GameView, SIDE, Side, SOLVER_STATE, SolverState } from '../../../objects/game';
import {
  AUTO_SOLVE_MOVE_DELAY_MS,
  CAP_RADIUS,
  Cell,
  TOKEN_DIAMETER,
  TURNTABLE_SIZE,
  TURNTABLE_START,
  closestT,
  rotate,
  slotPosition,
  solvedCells,
  solvedDirection,
  spinTurntable,
  trackPerimeter,
  trackStep,
} from './top-spin-logic';
import { SolverMove, solveTopSpin } from './top-spin-solver';
import { SettingsService } from '../../../services/settings';
import { GameStateService } from '../../../services/game-state';
import { HighScoreService } from '../../../services/high-score';
import { HighScoresComponent } from '../../high-scores/high-scores';
import { SaveScoreComponent } from '../../save-score/save-score';

const TILE_PARAM = 'top-spin';

interface TopSpinSaveState {
  cells: Cell[];
  moves: number;
  turntableSpinCount: number;
  pieceHalfTurns: [Cell, number][];
  gameId: string;
}

// Names for the four self-imposed modes described in the info panel: a
// number direction paired with which way the turntable's purple dot ends
// up facing (see turntableTransform, angle 0 leaves the dot at the top).
const MODE_NAMES = {
  ascending: { top: 'Unscramble', bottom: 'Unscramble Flip' },
  descending: { top: 'Reverse', bottom: 'Reverse Flip' },
} as const;

interface Token {
  value: Cell;
  transform: string;
  textTransform: string;
  inTurntable: boolean;
}

const INFO_COLUMNS: InfoColumn[] = [
  {
    h2: 'The Moves', p: [
      { strong: 'Rotate (left / right)', text: 'slides every piece one slot around the ring. The turntable itself never moves, pieces travel through it as the ring turns.' },
      { strong: 'Spin', text: 'reverses the order of whichever 4 pieces are currently sitting inside the turntable window. This is the only move that changes a piece\'s order relative to its neighbours, everything else just carries pieces past it.' },
    ]
  },
  {
    h2: 'Strategy', trivia: 'Every shuffle in this app is generated using only legal rotate and spin moves, so no matter how scrambled it looks, it\'s always possible to spin and rotate your way back to order.', p: [
      { text: 'Rotate a pair of out-of-order neighbours into the turntable window and spin to swap their positions, then rotate the next pair into place and repeat. Working through the ring a couple of pieces at a time is usually enough to untangle it.' },
      { text: 'The ring counts as solved once the numbers read consecutively all the way around, either forwards or backwards, so you don\'t need to hunt for a specific starting slot, just get every neighbour in the right order relative to the next.' },
      { text: 'For a stricter target, set yourself one of four named modes, each pairing a number direction with a turntable finish. The default, <strong>Unscramble</strong>, is 1 to 20 going right with the turntable\'s purple dot finishing at the top; <strong>Unscramble Flip</strong> is the same order but with the dot finishing at the bottom; <strong>Reverse</strong> runs 20 down to 1 going right with the dot at the top; and <strong>Reverse Flip</strong> pairs that same reversed order with the dot at the bottom.' },
    ]
  },
]

@Component({
  selector: 'app-top-spin',
  standalone: true,
  imports: [
    CommonModule, 
    HighScoresComponent, 
    SaveScoreComponent
  ],
  templateUrl: './top-spin.html',
  styleUrl: './top-spin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSpinComponent implements OnDestroy {
  private autoSolveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly GAME_VIEW = GAME_VIEW;
  readonly SOLVER_STATE = SOLVER_STATE;
  readonly INFO_COLUMNS = INFO_COLUMNS;
  readonly SIDE = SIDE;
  readonly TILE_PARAM = TILE_PARAM;
  readonly categoryName: string;

  private settingsService = inject(SettingsService);
  private gameState = inject(GameStateService);
  private highScoreService = inject(HighScoreService);
  private storageKey = this.settingsService.getStorageKey(TILE_PARAM);
  private saved = this.gameState.load<TopSpinSaveState>(this.storageKey);

  constructor() {
    this.categoryName = this.settingsService.getCategoryName(TILE_PARAM);

    effect(() => {
      this.gameState.save<TopSpinSaveState>(this.storageKey, {
        cells: this.cells(),
        moves: this.moves(),
        turntableSpinCount: this.turntableSpinCount(),
        pieceHalfTurns: [...this.pieceHalfTurns()],
        gameId: this.gameId(),
      });
    });

    effect(() => {
      const gameId = this.gameId();
      this.highScoreService.hasScoreForGame(TILE_PARAM, gameId).then(saved => {
        if (this.gameId() === gameId) {
          this.scoreSaved.set(saved);
        }
      });
    });
  }

  view = signal<GameView>(GAME_VIEW.PLAY);
  cells = signal<Cell[]>(this.saved?.cells ?? this.generateScrambled());
  moves = signal<number>(this.saved?.moves ?? 0);
  gameId = signal<string>(this.saved?.gameId ?? crypto.randomUUID());
  solverState = signal<SolverState>(SOLVER_STATE.IDLE);
  showSolveConfirm = signal<boolean>(false);
  scoreSaved = signal<boolean>(false);

  isLocked = computed<boolean>(() => this.solverState() !== SOLVER_STATE.IDLE);
  wasAutoSolved = computed<boolean>(() => this.solverState() === SOLVER_STATE.DONE);

  private solveDirection = computed(() => solvedDirection(this.cells()));
  isSolved = computed<boolean>(() => this.solveDirection() !== null);

  readonly turntableDiameterPx = (TURNTABLE_SIZE - 1) * trackStep() + TOKEN_DIAMETER;

  private turntableSpinCount = signal(this.saved?.turntableSpinCount ?? 0);
  turntableTransform = computed<string>(() => {
    const angle = this.turntableSpinCount() * 180;
    return `translate(-50%, calc(-50% - ${CAP_RADIUS}px)) rotate(${angle}deg)`;
  });

  solvedMode = computed<string | null>(() => {
    const direction = this.solveDirection();
    if (!direction) {
      return null;
    }
    const dotAtTop = this.turntableSpinCount() % 2 === 0;
    return MODE_NAMES[direction][dotAtTop ? 'top' : 'bottom'];
  });

  private pieceHalfTurns = signal<ReadonlyMap<Cell, number>>(new Map(this.saved?.pieceHalfTurns ?? []));
  isSpinning = signal(false);
  private static readonly SPIN_ANIM_MS = 400;

  private boardRing = viewChild<ElementRef<HTMLElement>>('boardRing');


  isDragging = signal(false);
  private dragOffset = signal(0);
  private dragCenter: { x: number; y: number } | null = null;
  private dragLastT = 0;
  private readonly onPointerMoveBound = (event: PointerEvent) => this.onPointerMove(event);
  private readonly onPointerEndBound = () => this.onPointerEnd();

  tokens = computed<Token[]>(() => {
    const cells = this.cells();
    const halfTurns = this.pieceHalfTurns();
    const dragOffset = this.dragOffset();
    const indexByValue = new Map<Cell, number>();
    cells.forEach((value, index) => indexByValue.set(value, index));

    return solvedCells().map(value => {
      const index = indexByValue.get(value) as number;
      const { x, y } = slotPosition(index + dragOffset);
      const inTurntable = index >= TURNTABLE_START && index < TURNTABLE_START + TURNTABLE_SIZE;
      const tilt = ((value * 53) % 25) - 12;
      const flips = halfTurns.get(value) ?? 0;
      const flipRotation = flips * 180;

      if (!inTurntable) {
        return {
          value,
          transform: `translate(${x}px, ${-y}px) rotate(${tilt + flipRotation}deg)`,
          textTransform: `rotate(${-flipRotation}deg)`,
          inTurntable,
        };
      }

      const sign = flips % 2 === 0 ? 1 : -1;
      return {
        value,
        transform: `translate(0px, ${-CAP_RADIUS}px) rotate(${flipRotation}deg) translate(${sign * x}px, ${CAP_RADIUS - y}px) rotate(${tilt}deg)`,
        textTransform: `rotate(${-flipRotation}deg)`,
        inTurntable,
      };
    });
  });

  toggleView(): void {
    this.view.set(this.view() === GAME_VIEW.PLAY ? GAME_VIEW.INFO : GAME_VIEW.PLAY);
  }

  toggleScores(): void {
    this.view.set(this.view() === GAME_VIEW.SCORES ? GAME_VIEW.PLAY : GAME_VIEW.SCORES);
  }

  async saveScore(initials: string): Promise<void> {
    const winType = this.solvedMode();
    if (this.scoreSaved() || this.wasAutoSolved() || !winType) {
      return;
    }

    await this.highScoreService.submitScore(TILE_PARAM, this.moves(), winType, initials, this.gameId());
    this.scoreSaved.set(true);
  }

  rotate(direction: Side): void {
    if (this.isSpinning() || this.isDragging()) {
      return;
    }
    this.cells.set(rotate(this.cells(), direction));
    this.moves.update(count => count + 1);
  }

  onTokenPointerDown(event: PointerEvent, value: Cell): void {
    if (this.isSpinning() || this.isDragging() || this.isLocked()) {
      return;
    }
    const ring = this.boardRing()?.nativeElement;
    if (!ring) {
      return;
    }
    event.preventDefault();

    const rect = ring.getBoundingClientRect();
    this.dragCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.dragLastT = closestT(this.pointerToTrackPoint(event));
    this.dragOffset.set(0);
    this.isDragging.set(true);

    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerEndBound);
    window.addEventListener('pointercancel', this.onPointerEndBound);
  }

  private pointerToTrackPoint(event: PointerEvent): { x: number; y: number } {
    const center = this.dragCenter as { x: number; y: number };
    return { x: event.clientX - center.x, y: -(event.clientY - center.y) };
  }

  private onPointerMove(event: PointerEvent): void {
    const t = closestT(this.pointerToTrackPoint(event));
    const perimeter = trackPerimeter();

    let delta = t - this.dragLastT;
    if (delta > perimeter / 2) {
      delta -= perimeter;
    } else if (delta < -perimeter / 2) {
      delta += perimeter;
    }
    this.dragLastT = t;
    this.dragOffset.update(offset => offset + delta / trackStep());
  }

  private onPointerEnd(): void {
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerEndBound);
    window.removeEventListener('pointercancel', this.onPointerEndBound);

    const steps = Math.round(this.dragOffset());
    if (steps !== 0) {
      const direction = steps > 0 ? SIDE.RIGHT : SIDE.LEFT;
      let cells = this.cells();
      for (let i = 0; i < Math.abs(steps); i++) {
        cells = rotate(cells, direction);
      }
      this.cells.set(cells);
      this.moves.update(count => count + Math.abs(steps));
    }

    this.dragOffset.set(0);
    this.isDragging.set(false);
    this.dragCenter = null;
  }

  spin(): void {
    if (this.isSpinning() || this.isDragging()) {
      return;
    }
    this.isSpinning.set(true);
    this.turntableSpinCount.update(count => count + 1);

    const spunValues = this.cells().slice(TURNTABLE_START, TURNTABLE_START + TURNTABLE_SIZE);
    this.pieceHalfTurns.update(halfTurns => {
      const next = new Map(halfTurns);
      for (const value of spunValues) {
        next.set(value, (next.get(value) ?? 0) + 1);
      }
      return next;
    });
    this.cells.set(spinTurntable(this.cells()));
    this.moves.update(count => count + 1);

    setTimeout(() => this.isSpinning.set(false), TopSpinComponent.SPIN_ANIM_MS);
  }

  onTurntableActivate(): void {
    if (this.isLocked()) {
      return;
    }
    this.spin();
  }

  newGame(): void {
    if (this.isSpinning() || this.isDragging()) {
      return;
    }
    this.clearAutoSolveTimer();
    this.solverState.set(SOLVER_STATE.IDLE);

    this.cells.set(this.generateScrambled());
    this.pieceHalfTurns.set(new Map());
    this.moves.set(0);
    this.gameId.set(crypto.randomUUID());
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

    this.autoSolveTimer = setTimeout(() => {
      const moves = solveTopSpin(this.cells());
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
    if (move.kind === 'rotate') {
      this.rotate(move.direction);
    } else {
      this.spin();
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

  private generateScrambled(): Cell[] {
    let cells = solvedCells();

    for (let i = 0; i < 300; i++) {
      if (Math.random() < 0.7) {
        cells = rotate(cells, Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT);
      } else {
        cells = spinTurntable(cells);
      }
    }

    return cells;
  }
}
