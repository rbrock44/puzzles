import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SeoTitleStrategy } from './services/seo';

describe('routes', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: TitleStrategy, useClass: SeoTitleStrategy }
      ]
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('should show the tile grid at the root', async () => {
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('app-category')).toBeTruthy();
    expect(TestBed.inject(Title).getTitle()).toBe('Puzzles');
  });

  it('should give each puzzle its own page', async () => {
    await harness.navigateByUrl('/rack-em-up');
    expect(router.url).toBe('/rack-em-up');
    expect(harness.routeNativeElement?.querySelector('app-back-button')).toBeTruthy();
    expect(TestBed.inject(Title).getTitle()).toBe("Rack 'em Up – Puzzles");
  });

  it('should load the puzzle into its page', async () => {
    await harness.navigateByUrl('/top-spin');
    await vi.waitFor(() => expect(harness.routeNativeElement?.querySelector('app-top-spin')).toBeTruthy());
  });

  it('should redirect old tile links to the puzzle page', async () => {
    await harness.navigateByUrl('/?tile=top-spin');
    expect(router.url).toBe('/top-spin');
  });

  it('should redirect old tile aliases to the puzzle page', async () => {
    await harness.navigateByUrl('/?tile=reu');
    expect(router.url).toBe('/rack-em-up');
  });

  it('should stay home for an unknown tile', async () => {
    await harness.navigateByUrl('/?tile=nope');
    expect(router.url).toBe('/?tile=nope');
  });

  it('should send unknown paths home', async () => {
    await harness.navigateByUrl('/nope');
    expect(router.url).toBe('/');
  });
});
