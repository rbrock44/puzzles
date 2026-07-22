import { Direction, SIDE, Side, DIRECTION } from '../../../objects/game';
import { Cell, COLS, applyTilt, canShiftState, isSolvedState } from './rack-em-up-logic';

export type SolverMove =
  | { kind: 'tilt'; direction: Side }
  | { kind: 'shift'; side: Side; direction: Direction };

interface BoardState {
  cells: Cell[];
  plngl: number;
  plngr: number;
}

interface HeapItem {
  f: number;
  g: number;
  key: string;
  state: BoardState;
}

// Weighted A* (f = g + weight*h) trades solution length for speed. These
// tiers start greedy/fast and fall back to a wider search only if needed.
const SEARCH_TIERS: { weight: number; maxExpansions: number }[] = [
  { weight: 6, maxExpansions: 400_000 },
  { weight: 10, maxExpansions: 600_000 },
  { weight: 16, maxExpansions: 1_000_000 },
];

function stateKey(cells: Cell[], plngl: number, plngr: number): string {
  let key = '';
  for (const value of cells) {
    key += value === null ? '.' : value;
  }
  return `${key}|${plngl}|${plngr}`;
}

function heuristic(cells: Cell[], plngl: number, plngr: number): number {
  let misplaced = 0;
  for (let i = 0; i < cells.length; i++) {
    const value = cells[i];
    if (value !== null && value !== Math.floor(i / COLS)) {
      misplaced++;
    }
  }
  return misplaced + Math.abs(plngl) + Math.abs(plngr);
}

function neighbors(state: BoardState): { move: SolverMove; state: BoardState }[] {
  const results: { move: SolverMove; state: BoardState }[] = [];
  const currentKey = stateKey(state.cells, state.plngl, state.plngr);

  for (const direction of [SIDE.LEFT, SIDE.RIGHT] as const) {
    const tilted = applyTilt(state.cells, state.plngl, state.plngr, direction);
    if (stateKey(tilted, state.plngl, state.plngr) !== currentKey) {
      results.push({
        move: { kind: 'tilt', direction },
        state: { cells: tilted, plngl: state.plngl, plngr: state.plngr },
      });
    }
  }

  for (const side of [SIDE.LEFT, SIDE.RIGHT] as const) {
    for (const direction of [DIRECTION.UP, DIRECTION.DOWN] as const) {
      const plng = side === SIDE.LEFT ? state.plngl : state.plngr;
      if (!canShiftState(plng, direction)) {
        continue;
      }
      const delta = direction === DIRECTION.UP ? -1 : 1;
      const next: BoardState =
        side === SIDE.LEFT
          ? { cells: state.cells, plngl: state.plngl + delta, plngr: state.plngr }
          : { cells: state.cells, plngl: state.plngl, plngr: state.plngr + delta };
      results.push({ move: { kind: 'shift', side, direction }, state: next });
    }
  }

  return results;
}

class MinHeap {
  private items: HeapItem[] = [];

  get size(): number {
    return this.items.length;
  }

  push(item: HeapItem): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].f <= this.items[i].f) {
        break;
      }
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop(): HeapItem | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < this.items.length && this.items[left].f < this.items[smallest].f) {
          smallest = left;
        }
        if (right < this.items.length && this.items[right].f < this.items[smallest].f) {
          smallest = right;
        }
        if (smallest === i) {
          break;
        }
        [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

function searchWeighted(start: BoardState, weight: number, maxExpansions: number): SolverMove[] | null {
  const startKey = stateKey(start.cells, start.plngl, start.plngr);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const cameFrom = new Map<string, { prevKey: string; move: SolverMove }>();
  const heap = new MinHeap();
  heap.push({ f: heuristic(start.cells, start.plngl, start.plngr) * weight, g: 0, key: startKey, state: start });

  let expansions = 0;
  while (heap.size > 0) {
    const current = heap.pop();
    if (!current) {
      break;
    }
    if (current.g > (gScore.get(current.key) ?? Infinity)) {
      continue;
    }

    expansions++;
    if (expansions > maxExpansions) {
      return null;
    }

    if (isSolvedState(current.state.cells, current.state.plngl, current.state.plngr)) {
      const moves: SolverMove[] = [];
      let key = current.key;
      while (cameFrom.has(key)) {
        const entry = cameFrom.get(key)!;
        moves.push(entry.move);
        key = entry.prevKey;
      }
      moves.reverse();
      return moves;
    }

    for (const { move, state } of neighbors(current.state)) {
      const key = stateKey(state.cells, state.plngl, state.plngr);
      const g = current.g + 1;
      if (g < (gScore.get(key) ?? Infinity)) {
        gScore.set(key, g);
        cameFrom.set(key, { prevKey: current.key, move });
        heap.push({ f: g + heuristic(state.cells, state.plngl, state.plngr) * weight, g, key, state });
      }
    }
  }

  return null;
}

/**
 * Finds a sequence of moves that solves the board from the given state.
 * Returns an empty array if already solved, or null in the (practically
 * unreachable, but handled) case that every search tier fails.
 */
export function solveRackEmUp(cells: Cell[], plngl: number, plngr: number): SolverMove[] | null {
  if (isSolvedState(cells, plngl, plngr)) {
    return [];
  }

  const start: BoardState = { cells, plngl, plngr };
  for (const { weight, maxExpansions } of SEARCH_TIERS) {
    const result = searchWeighted(start, weight, maxExpansions);
    if (result) {
      return result;
    }
  }

  return null;
}
