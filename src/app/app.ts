import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterOutlet } from '@angular/router';
import { TileGridComponent } from './components/tile-grid/tile-grid';
import { HeaderComponent } from './components/header/header';
import { BackButtonComponent } from './components/back-button/back-button';
import { SettingsService } from './services/settings';
import { RackEmUpComponent } from './components/classic-puzzles/rack-em-up/rack-em-up';
import { TopSpinComponent } from './components/classic-puzzles/top-spin/top-spin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    BackButtonComponent,
    RackEmUpComponent,
    TopSpinComponent,
    TileGridComponent,
    RouterOutlet,
    CommonModule,
],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('puzzles');

  constructor(
    public settingsService: SettingsService,
  ) { }

  ngOnInit(): void {
    this.settingsService.restoreFromUrl();
  }
}
