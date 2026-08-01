import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-save-score',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-score.html',
  styleUrl: './save-score.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveScoreComponent {
  saved = input<boolean>(false);
  save = output<string>();

  initials = signal<string>('');

  isValid = computed<boolean>(() => /^[A-Z]{3}$/.test(this.initials()));

  onInput(value: string): void {
    this.initials.set(value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3));
  }

  submit(): void {
    if (!this.isValid()) {
      return;
    }
    this.save.emit(this.initials());
  }
}
