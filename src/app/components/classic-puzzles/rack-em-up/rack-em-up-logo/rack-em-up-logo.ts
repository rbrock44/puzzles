import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-rack-em-up-logo',
  standalone: true,
  templateUrl: './rack-em-up-logo.html',
  styleUrl: './rack-em-up-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact',
  },
})
export class RackEmUpLogoComponent {
  @Input() compact = false;
}
