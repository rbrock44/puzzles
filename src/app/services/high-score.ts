import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state';
import { HighScoreEntry } from '../objects/high-score';

const STORAGE_KEY = 'puzzles-high-scores';
const MAX_ENTRIES_PER_PUZZLE = 10;

// This key stops a casual localStorage/devtools edit (or an atob/btoa
// round-trip) from producing an entry that still verifies
// it is not a secret from someone willing to read the bundled JS
const SIGNING_KEY = 'puzzles-app-9f2b6b9e-9d3e-4b8b-8b7a-6a6f6b9d7c3e-integrity';

interface SignedHighScoreEntry extends HighScoreEntry {
  sig: string;
}

type ScoreStore = Record<string, SignedHighScoreEntry[]>;

@Injectable({
  providedIn: 'root',
})
export class HighScoreService {
  private gameState = inject(GameStateService);
  private keyPromise: Promise<CryptoKey> | null = null;

  async getScores(puzzle: string): Promise<HighScoreEntry[]> {
    const store = this.gameState.load<ScoreStore>(STORAGE_KEY) ?? {};
    const entries = store[puzzle] ?? [];
    const verified = await this.filterValid(puzzle, entries);

    if (verified.length !== entries.length) {
      store[puzzle] = verified;
      this.gameState.save(STORAGE_KEY, store);
    }

    return verified.map(entry => this.strip(entry)).sort(this.compare);
  }

  async hasScoreForGame(puzzle: string, gameId: string): Promise<boolean> {
    const scores = await this.getScores(puzzle);
    return scores.some(entry => entry.gameId === gameId);
  }

  async submitScore(puzzle: string, moves: number, winType: string, initials: string, gameId: string): Promise<HighScoreEntry[]> {
    const store = this.gameState.load<ScoreStore>(STORAGE_KEY) ?? {};
    const existing = await this.filterValid(puzzle, store[puzzle] ?? []);

    if (existing.some(entry => entry.gameId === gameId)) {
      return existing.map(e => this.strip(e)).sort(this.compare);
    }

    const entry: HighScoreEntry = {
      id: crypto.randomUUID(),
      gameId,
      initials: initials.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3),
      moves,
      winType,
      date: new Date().toISOString(),
    };

    const signed: SignedHighScoreEntry = {
      ...entry,
      sig: await this.sign(puzzle, entry),
    };

    const combined = [...existing, signed].sort(this.compare).slice(0, MAX_ENTRIES_PER_PUZZLE);
    store[puzzle] = combined;
    this.gameState.save(STORAGE_KEY, store);

    return combined.map(e => this.strip(e));
  }

  private strip(entry: SignedHighScoreEntry): HighScoreEntry {
    const { sig, ...rest } = entry;
    return rest;
  }

  private compare = (a: HighScoreEntry, b: HighScoreEntry): number => {
    if (a.moves !== b.moves) {
      return a.moves - b.moves;
    }
    return a.date.localeCompare(b.date);
  };

  private async filterValid(puzzle: string, entries: SignedHighScoreEntry[]): Promise<SignedHighScoreEntry[]> {
    const checks = await Promise.all(entries.map(async entry => ({ entry, ok: await this.verify(puzzle, entry) })));
    return checks.filter(check => check.ok).map(check => check.entry);
  }

  private canonicalize(puzzle: string, entry: HighScoreEntry): string {
    return [puzzle, entry.id, entry.gameId, entry.initials, entry.moves, entry.winType, entry.date].join('|');
  }

  private async getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(SIGNING_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
      );
    }
    return this.keyPromise;
  }

  private async sign(puzzle: string, entry: HighScoreEntry): Promise<string> {
    const key = await this.getKey();
    const data = new TextEncoder().encode(this.canonicalize(puzzle, entry));
    const signature = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verify(puzzle: string, entry: SignedHighScoreEntry): Promise<boolean> {
    if (
      typeof entry.sig !== 'string' ||
      typeof entry.moves !== 'number' ||
      !Number.isFinite(entry.moves) ||
      typeof entry.initials !== 'string' ||
      typeof entry.gameId !== 'string'
    ) {
      return false;
    }

    try {
      const key = await this.getKey();
      const data = new TextEncoder().encode(this.canonicalize(puzzle, entry));
      const signatureBytes = entry.sig.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) ?? [];
      if (signatureBytes.length === 0) {
        return false;
      }
      return await crypto.subtle.verify('HMAC', key, new Uint8Array(signatureBytes), data);
    } catch {
      return false;
    }
  }
}
