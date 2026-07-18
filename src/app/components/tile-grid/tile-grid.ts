import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryComponent } from '../category/category';
import { SettingsService } from '../../services/settings';

@Component({
  selector: 'app-tile-grid',
  standalone: true,
  imports: [CommonModule, CategoryComponent],
  templateUrl: './tile-grid.html',
  styleUrl: './tile-grid.scss',
})
export class TileGridComponent {
  constructor(
    public settingsService: SettingsService
  ) {
  }
}
