import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  constructor(
    private settingsService: SettingsService,
    public themeService: ThemeService
  ) {
  }

  goHome() {
    this.settingsService.setSelectedTile();
    this.settingsService.resetUrl();
  }
}
