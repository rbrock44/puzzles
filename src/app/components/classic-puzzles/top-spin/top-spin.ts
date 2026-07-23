import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { InfoColumn } from '../../../objects/info';
import { GAME_VIEW, GameView, SIDE, Side } from '../../../objects/game';
import {
  CAP_RADIUS,
  Cell,
  TOKEN_DIAMETER,
  TURNTABLE_SIZE,
  TURNTABLE_START,
  rotate,
  slotPosition,
  solvedCells,
  solvedDirection,
  spinTurntable,
  trackStep,
} from './top-spin-logic';

// Names for the four self-imposed modes described in the info panel: a
// number direction paired with which way the turntable's purple dot ends
// up facing (see turntableTransform, angle 0 leaves the dot at the bottom).
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
  imports: [CommonModule],
  templateUrl: './top-spin.html',
  styleUrl: './top-spin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSpinComponent {
  readonly GAME_VIEW = GAME_VIEW;
  readonly INFO_COLUMNS = INFO_COLUMNS;
  readonly SIDE = SIDE;


  view = signal<GameView>(GAME_VIEW.PLAY);
  cells = signal<Cell[]>(this.generateScrambled());
  moves = signal<number>(0);

  private solveDirection = computed(() => solvedDirection(this.cells()));
  isSolved = computed<boolean>(() => this.solveDirection() !== null);

  // The turntable is drawn as a circle straddling a straight, matching the
  // real toy: a ridged grip half poking above the track and a smooth face
  // below it, sized to hold all 4 pieces in its window.
  readonly turntableDiameterPx = (TURNTABLE_SIZE - 1) * trackStep() + TOKEN_DIAMETER;

  // Every spin click keeps turning the disc another half-turn rather than
  // resetting, so repeated spins visibly keep spinning it further.
  private turntableSpinCount = signal(0);
  turntableTransform = computed<string>(() => {
    const angle = this.turntableSpinCount() * 180;
    return `translate(-50%, calc(-50% - ${CAP_RADIUS}px)) rotate(${angle}deg)`;
  });

  // Names the mode the player actually finished in (see MODE_NAMES): the
  // ring's own solved direction paired with which way the turntable's dot
  // happens to be facing when they land on it. Null unless isSolved().
  solvedMode = computed<string | null>(() => {
    const direction = this.solveDirection();
    if (!direction) {
      return null;
    }
    const dotAtTop = this.turntableSpinCount() % 2 === 1;
    return MODE_NAMES[direction][dotAtTop ? 'top' : 'bottom'];
  });

  // Each piece that's ever been caught in a spin keeps a running half-turn
  // count, exactly like turntableSpinCount above: it only ever increases, it
  // is never reset back down. That's deliberate. An earlier version reset a
  // "live" spin angle back to 0 once a spin finished (while separately
  // baking the same 180deg into a permanent total, so the visual result was
  // meant to match) but CSS has no idea those two changes were meant to
  // cancel out: it saw the rotation go 180->0 and separately go up by 180 as
  // two independent property changes and animated both in full, which played
  // out as a second, unwanted spin. Counting up forever (like the disc does)
  // means there is never a reset to animate away in the first place.
  private pieceHalfTurns = signal<ReadonlyMap<Cell, number>>(new Map());
  isSpinning = signal(false);
  private static readonly SPIN_ANIM_MS = 400;

  // Always built in the same fixed value order (1..20), never in cells'
  // current order, so the @for below never needs to reorder DOM nodes: only
  // each token's own bound transform changes. Iterating in cells() order
  // meant a spin (which reverses the two middle turntable slots) reordered
  // the array Angular saw, and its list diffing recreated one of the two
  // swapped elements mid-flight instead of just moving it, which dropped its
  // in-progress CSS transition and made it visibly jump/animate differently
  // to the other 3 pieces.
  tokens = computed<Token[]>(() => {
    const cells = this.cells();
    const halfTurns = this.pieceHalfTurns();
    const indexByValue = new Map<Cell, number>();
    cells.forEach((value, index) => indexByValue.set(value, index));

    return solvedCells().map(value => {
      const index = indexByValue.get(value) as number;
      const { x, y } = slotPosition(index);
      const inTurntable = index >= TURNTABLE_START && index < TURNTABLE_START + TURNTABLE_SIZE;
      // Flip vertically so the turntable (slot 0) sits on the top straight,
      // and give each piece a small fixed tilt like loose plastic caps.
      const tilt = ((value * 53) % 25) - 12;
      const flips = halfTurns.get(value) ?? 0;
      // Rotation contributed purely by having been carried through spins,
      // as opposed to the piece's own decorative tilt. The text always
      // counters exactly this much, so the number stays readable regardless
      // of how many times the piece has been flipped.
      const flipRotation = flips * 180;

      if (!inTurntable) {
        return {
          value,
          transform: `translate(${x}px, ${-y}px) rotate(${tilt + flipRotation}deg)`,
          textTransform: `rotate(${-flipRotation}deg)`,
          inTurntable,
        };
      }

      // While riding the turntable, the piece is genuinely "stuck" to the
      // disc: it orbits the disc's centre by flipRotation, the exact same
      // ever-increasing angle the disc itself turns by. A piece's own local
      // offset from that centre would otherwise need to flip sign every time
      // it's carried through a half-turn (since the disc keeps turning but
      // the piece's actual slot only alternates between two positions) -
      // baking that sign into the offset itself keeps the offset genuinely
      // constant across any single spin, so there is nothing to reset here
      // either, only the disc's own already-continuous rotation.
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

  rotate(direction: Side): void {
    if (this.isSpinning()) {
      return;
    }
    this.cells.set(rotate(this.cells(), direction));
    this.moves.update(count => count + 1);
  }

  spin(): void {
    if (this.isSpinning()) {
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

    // Only gates the buttons so a second click can't land mid-animation;
    // unlike the swap above, timing here doesn't need to be exact.
    setTimeout(() => this.isSpinning.set(false), TopSpinComponent.SPIN_ANIM_MS);
  }

  newGame(): void {
    if (this.isSpinning()) {
      return;
    }
    this.cells.set(this.generateScrambled());
    this.pieceHalfTurns.set(new Map());
    this.moves.set(0);
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
