import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HighScoresComponent } from '../high-scores/high-scores';

@Component({
  selector: 'app-high-scores-panel',
  standalone: true,
  imports: [CommonModule, HighScoresComponent],
  templateUrl: './high-scores-panel.html',
  styleUrl: './high-scores-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighScoresPanelComponent {
  puzzle = input.required<string>();
  back = output<void>();
}
