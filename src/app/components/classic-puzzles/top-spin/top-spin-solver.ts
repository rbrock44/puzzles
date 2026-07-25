import type { Side } from '../../../objects/game';
import { SIDE } from '../../../objects/game';
import { Cell, TRACK_LENGTH, isSolvedState, rotate, spinTurntable } from './top-spin-logic';

export type SolverMove = { kind: 'rotate'; direction: Side } | { kind: 'spin' };

interface HeapItem {
  f: number;
  g: number;
  key: string;
  cells: Cell[];
}

const SEARCH_TIERS: { weight: number; maxExpansions: number }[] = [
  { weight: 8, maxExpansions: 400_000 },
  { weight: 14, maxExpansions: 800_000 },
  { weight: 22, maxExpansions: 1_500_000 },
];

function stateKey(cells: Cell[]): string {
  return cells.join(',');
}

function heuristic(cells: Cell[]): number {
  let ascendingBreaks = 0;
  let descendingBreaks = 0;

  for (let i = 0; i < TRACK_LENGTH; i++) {
    const current = cells[i];
    const next = cells[(i + 1) % TRACK_LENGTH];
    if (next !== (current % TRACK_LENGTH) + 1) {
      ascendingBreaks++;
    }
    if (current !== (next % TRACK_LENGTH) + 1) {
      descendingBreaks++;
    }
  }

  return Math.min(ascendingBreaks, descendingBreaks);
}

function neighbors(cells: Cell[]): { move: SolverMove; cells: Cell[] }[] {
  return [
    { move: { kind: 'rotate', direction: SIDE.LEFT }, cells: rotate(cells, SIDE.LEFT) },
    { move: { kind: 'rotate', direction: SIDE.RIGHT }, cells: rotate(cells, SIDE.RIGHT) },
    { move: { kind: 'spin' }, cells: spinTurntable(cells) },
  ];
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

function searchWeighted(start: Cell[], weight: number, maxExpansions: number): SolverMove[] | null {
  const startKey = stateKey(start);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const cameFrom = new Map<string, { prevKey: string; move: SolverMove }>();
  const heap = new MinHeap();
  heap.push({ f: heuristic(start) * weight, g: 0, key: startKey, cells: start });

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

    if (isSolvedState(current.cells)) {
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

    for (const { move, cells } of neighbors(current.cells)) {
      const key = stateKey(cells);
      const g = current.g + 1;
      if (g < (gScore.get(key) ?? Infinity)) {
        gScore.set(key, g);
        cameFrom.set(key, { prevKey: current.key, move });
        heap.push({ f: g + heuristic(cells) * weight, g, key, cells });
      }
    }
  }

  return null;
}

export function solveTopSpin(cells: Cell[]): SolverMove[] | null {
  if (isSolvedState(cells)) {
    return [];
  }

  for (const { weight, maxExpansions } of SEARCH_TIERS) {
    const result = searchWeighted(cells, weight, maxExpansions);
    if (result) {
      return result;
    }
  }

  return null;
}
