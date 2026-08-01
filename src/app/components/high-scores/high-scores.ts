import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { HighScoreEntry } from '../../objects/high-score';
import { HighScoreService } from '../../services/high-score';

@Component({
  selector: 'app-high-scores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './high-scores.html',
  styleUrl: './high-scores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighScoresComponent {
  puzzle = input.required<string>();

  private highScoreService = inject(HighScoreService);

  scores = signal<HighScoreEntry[] | null>(null);

  constructor() {
    effect(() => {
      const puzzle = this.puzzle();
      this.scores.set(null);
      this.highScoreService.getScores(puzzle).then(scores => this.scores.set(scores));
    });
  }
}
