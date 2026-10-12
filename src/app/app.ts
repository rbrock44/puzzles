import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
import { HeaderComponent } from './components/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.slotHomeUnderDeepLink();
    }
  }

  /**
   * A home entry is slotted in underneath a deep-linked puzzle so browser/mouse back and the
   * back button land on the home page instead of leaving the site.
   */
  private slotHomeUnderDeepLink(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), take(1))
      .subscribe(event => {
        if (event.urlAfterRedirects !== '/') {
          this.location.replaceState('/');
          this.location.go(event.urlAfterRedirects);
        }
      });
  }
}
