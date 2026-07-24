import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SettingsService } from '../../services/settings';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  constructor(private settingsService: SettingsService) {}

  goBack(): void {
    this.settingsService.setSelectedTile();
    this.settingsService.resetUrl();
  }
}
