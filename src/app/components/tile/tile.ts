import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tile } from '../../objects/tile';
import { RackEmUpMiniLogoComponent } from '../classic-puzzles/rack-em-up/rack-em-up-mini-logo/rack-em-up-mini-logo';
import { TopSpinLogoComponent } from '../classic-puzzles/top-spin/top-spin-logo/top-spin-logo';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
}
