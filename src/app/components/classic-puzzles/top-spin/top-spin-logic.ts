import type { Side } from '../../../objects/game';
import { SIDE } from '../../../objects/game';

export const TRACK_LENGTH = 20;
export const TURNTABLE_SIZE = 4;
export const TURNTABLE_START = 0;

export type Cell = number;
export interface TrackPoint {
  x: number;
  y: number;
}

// The board is a stadium/racetrack shape (two straight sides joined by two
// semicircular caps), matching the physical toy's oval track: 8 pieces sit
// along each straight and 2 around each end cap. CAP_RADIUS sets how far
// apart the two straights sit from one another (the taller this is, the
// more open/oval the track looks rather than a flattened line).
// The turntable window is embedded in a straight, centred on it.
export const STRAIGHT_LENGTH = 240;
export const CAP_RADIUS = 42;

// Visual diameter of a single token piece (kept in sync with the .token
// width/height in top-spin.scss) so the turntable graphic can be sized
// relative to it.
export const TOKEN_DIAMETER = 30;

export function solvedCells(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < TRACK_LENGTH; i++) {
    cells.push(i + 1);
  }
  return cells;
}

export function rotate(cells: Cell[], direction: Side): Cell[] {
  const next = [...cells];
  if (direction === SIDE.LEFT) {
    next.push(next.shift() as Cell);
  } else {
    next.unshift(next.pop() as Cell);
  }
  return next;
}

export function spinTurntable(cells: Cell[]): Cell[] {
  const next = [...cells];
  for (let offset = 0; offset < Math.floor(TURNTABLE_SIZE / 2); offset++) {
    const a = (TURNTABLE_START + offset) % TRACK_LENGTH;
    const b = (TURNTABLE_START + TURNTABLE_SIZE - 1 - offset) % TRACK_LENGTH;
    const tmp = next[a];
    next[a] = next[b];
    next[b] = tmp;
  }
  return next;
}

export function isSolvedState(cells: Cell[]): boolean {
  let ascending = true;
  let descending = true;

  for (let i = 0; i < TRACK_LENGTH; i++) {
    const current = cells[i];
    const next = cells[(i + 1) % TRACK_LENGTH];

    if (next !== (current % TRACK_LENGTH) + 1) {
      ascending = false;
    }
    if (current !== (next % TRACK_LENGTH) + 1) {
      descending = false;
    }
  }

  return ascending || descending;
}

function trackPerimeter(): number {
  return 2 * STRAIGHT_LENGTH + 2 * Math.PI * CAP_RADIUS;
}

export function trackStep(): number {
  return trackPerimeter() / TRACK_LENGTH;
}

// Returns the (x, y) offset from the board's centre for a given slot index.
// Slot indexes increase along the path: bottom straight (left to right),
// right cap, top straight (right to left), left cap, back to the start.
// The turntable window (TURNTABLE_START..+TURNTABLE_SIZE) is centred on the
// bottom straight.
export function slotPosition(index: number): TrackPoint {
  const perimeter = trackPerimeter();
  const step = trackStep();
  const half = STRAIGHT_LENGTH / 2;
  const capArc = Math.PI * CAP_RADIUS;

  let t = half + (index - (TURNTABLE_SIZE - 1) / 2) * step;
  t = ((t % perimeter) + perimeter) % perimeter;

  if (t < STRAIGHT_LENGTH) {
    return { x: -half + t, y: CAP_RADIUS };
  }
  t -= STRAIGHT_LENGTH;

  if (t < capArc) {
    const phi = t / CAP_RADIUS;
    return { x: half + CAP_RADIUS * Math.sin(phi), y: CAP_RADIUS * Math.cos(phi) };
  }
  t -= capArc;

  if (t < STRAIGHT_LENGTH) {
    return { x: half - t, y: -CAP_RADIUS };
  }
  t -= STRAIGHT_LENGTH;

  const phi = t / CAP_RADIUS;
  return { x: -half - CAP_RADIUS * Math.sin(phi), y: -CAP_RADIUS * Math.cos(phi) };
}
