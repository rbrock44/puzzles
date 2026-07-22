import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-spin-logo',
  standalone: true,
  templateUrl: './top-spin-logo.html',
  styleUrl: './top-spin-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact',
  },
})
export class TopSpinLogoComponent {
  @Input() compact = false;
}
