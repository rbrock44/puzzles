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

export type SolveDirection = 'ascending' | 'descending';

// Which way the numbers read consecutively around the ring, or null if
// they don't (yet). Split out from a plain isSolvedState boolean so the UI
// can name the specific mode the player finished in, not just "solved".
export function solvedDirection(cells: Cell[]): SolveDirection | null {
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

  if (ascending) {
    return 'ascending';
  }
  return descending ? 'descending' : null;
}

export function isSolvedState(cells: Cell[]): boolean {
  return solvedDirection(cells) !== null;
}

export function trackPerimeter(): number {
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

// Inverse of the raw t -> point mapping inside slotPosition: given any point
// (typically a drag pointer, which during a fast drag can land well off the
// path between two sparse mousemove samples), returns the t it maps to.
//
// This classifies the point into one of the track's 4 zones by simple
// position (which half of the middle strip, or off one end) rather than by
// which of the 4 segments it's nearest to. Nearest-segment is ambiguous (and
// so unstable frame-to-frame) for points away from the track, e.g. one near
// the ring's centre is almost equidistant from all 4 segments; a fast drag
// samples exactly those in-between points, so that ambiguity showed up as
// the ring briefly rotating the wrong way or snapping through extra slots.
// Zone-by-position has no such ambiguity: every point in the plane, however
// far from the track, falls in exactly one zone, and maps continuously to a
// t within it, so it stays stable regardless of how far a drag jumps between
// samples.
export function closestT(point: TrackPoint): number {
  const half = STRAIGHT_LENGTH / 2;
  const capArc = Math.PI * CAP_RADIUS;
  const { x, y } = point;

  if (x >= half) {
    // Right cap zone: angle around (half, 0), phi 0 at the bottom
    // straight's end, phi pi at the top straight's start.
    const phi = Math.min(Math.max(Math.atan2(x - half, y), 0), Math.PI);
    return STRAIGHT_LENGTH + CAP_RADIUS * phi;
  }

  if (x <= -half) {
    // Left cap zone: angle around (-half, 0), phi 0 at the top straight's
    // end, phi pi back at the bottom straight's start.
    const phi = Math.min(Math.max(Math.atan2(-(x + half), -y), 0), Math.PI);
    return STRAIGHT_LENGTH + capArc + STRAIGHT_LENGTH + CAP_RADIUS * phi;
  }

  if (y >= 0) {
    // Bottom straight: y = CAP_RADIUS, x from -half to half.
    return x + half;
  }

  // Top straight: y = -CAP_RADIUS, x from half down to -half.
  return STRAIGHT_LENGTH + capArc + (half - x);
}
