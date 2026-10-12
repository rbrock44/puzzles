import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  constructor(private location: Location) {}

  /** A home entry always sits underneath a puzzle page (see App), so back lands home. */
  goBack(): void {
    this.location.back();
  }
}
