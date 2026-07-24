import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Tile } from '../../objects/tile';
import { SettingsService } from '../../services/settings';
import { RackEmUpMiniLogoComponent } from '../classic-puzzles/rack-em-up/rack-em-up-mini-logo/rack-em-up-mini-logo';
import { TopSpinLogoComponent } from '../classic-puzzles/top-spin/top-spin-logo/top-spin-logo';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [
    CommonModule,
    RackEmUpMiniLogoComponent,
    TopSpinLogoComponent
  ],
  templateUrl: './tile.html',
  styleUrl: './tile.scss',
})
export class TileComponent {
  @Input() tile: Tile = {
    title: '',
    description: '',
    icon: '',
    param: '',
    storageKey: ''
  };

  constructor(
    private settingsService: SettingsService
  ) {
  }

  handleClick() {
    this.settingsService.setSelectedTile(this.tile.param);
    this.settingsService.resetUrl();
  }
}
