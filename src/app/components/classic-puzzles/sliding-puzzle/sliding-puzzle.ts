import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings';
import { GameStateService } from '../../../services/game-state';
import { HighScoreService } from '../../../services/high-score';
import { HighScoresComponent } from '../../high-scores/high-scores';
import { SaveScoreComponent } from '../../save-score/save-score';

const SIZE = 4;
const BLANK = 0;
const TILE_PARAM = 'sliding-puzzle';

interface SlidingPuzzleSaveState {
  board: number[];
  moves: number;
  gameId: string;
}

@Component({
  selector: 'app-sliding-puzzle',
  standalone: true,
  imports: [CommonModule, HighScoresComponent, SaveScoreComponent],
  templateUrl: './sliding-puzzle.html',
  styleUrl: './sliding-puzzle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidingPuzzleComponent {
  readonly TILE_PARAM = TILE_PARAM;
  readonly categoryName: string;

  private settingsService = inject(SettingsService);
  private gameState = inject(GameStateService);
  private highScoreService = inject(HighScoreService);
  private storageKey = this.settingsService.getStorageKey(TILE_PARAM);
  private saved = this.gameState.load<SlidingPuzzleSaveState>(this.storageKey);

  constructor() {
    this.categoryName = this.settingsService.getCategoryName(TILE_PARAM);

    effect(() => {
      this.gameState.save<SlidingPuzzleSaveState>(this.storageKey, {
        board: this.board(),
        moves: this.moves(),
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

  board = signal<number[]>(this.saved?.board ?? this.shuffled());
  moves = signal<number>(this.saved?.moves ?? 0);
  gameId = signal<string>(this.saved?.gameId ?? crypto.randomUUID());
  showScores = signal<boolean>(false);
  scoreSaved = signal<boolean>(false);

  isSolved = computed<boolean>(() => {
    const tiles = this.board();
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) {
        return false;
      }
    }
    return true;
  });

  handleTileClick(index: number): void {
    if (this.isSolved()) {
      return;
    }

    const blankIndex = this.board().indexOf(BLANK);
    if (!this.isAdjacent(index, blankIndex)) {
      return;
    }

    const tiles = [...this.board()];
    [tiles[index], tiles[blankIndex]] = [tiles[blankIndex], tiles[index]];
    this.board.set(tiles);
    this.moves.update(count => count + 1);
  }

  newGame(): void {
    this.board.set(this.shuffled());
    this.moves.set(0);
    this.gameId.set(crypto.randomUUID());
  }

  async saveScore(initials: string): Promise<void> {
    if (this.scoreSaved() || !this.isSolved()) {
      return;
    }

    await this.highScoreService.submitScore(TILE_PARAM, this.moves(), 'Solved', initials, this.gameId());
    this.scoreSaved.set(true);
  }

  private isAdjacent(a: number, b: number): boolean {
    const rowA = Math.floor(a / SIZE);
    const colA = a % SIZE;
    const rowB = Math.floor(b / SIZE);
    const colB = b % SIZE;
    return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
  }

  private shuffled(): number[] {
    const tiles = Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1);
    tiles.push(BLANK);

    let blankIndex = tiles.length - 1;
    for (let i = 0; i < 500; i++) {
      const neighbors = this.neighborsOf(blankIndex);
      const swapIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[blankIndex], tiles[swapIndex]] = [tiles[swapIndex], tiles[blankIndex]];
      blankIndex = swapIndex;
    }

    return tiles;
  }

  private neighborsOf(index: number): number[] {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const neighbors: number[] = [];

    if (row > 0) neighbors.push(index - SIZE);
    if (row < SIZE - 1) neighbors.push(index + SIZE);
    if (col > 0) neighbors.push(index - 1);
    if (col < SIZE - 1) neighbors.push(index + 1);

    return neighbors;
  }
}
