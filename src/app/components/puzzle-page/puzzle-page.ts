import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BackButtonComponent } from '../back-button/back-button';
import { PageData } from '../../constants/site';

const RELOAD_KEY = 'puzzles-chunk-reload';
/** A second failure this soon after reloading means something other than a stale deploy. */
const RELOAD_WINDOW_MS = 30_000;

/**
 * Hosts one puzzle. The puzzle is only loaded in the browser (afterNextRender never runs
 * while prerendering), so puzzles can use window, crypto, and storage freely and the static
 * page ships just the placeholder plus that puzzle's metadata.
 */
@Component({
  selector: 'app-puzzle-page',
  standalone: true,
  imports: [NgComponentOutlet, BackButtonComponent],
  templateUrl: './puzzle-page.html',
  styleUrl: './puzzle-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuzzlePageComponent {
  private readonly data = inject(ActivatedRoute).snapshot.data as PageData;

  readonly component = signal<Type<unknown> | null>(null);
  readonly loadFailed = signal(false);

  constructor() {
    afterNextRender(() => this.loadPuzzle());
  }

  retry(): void {
    this.reloadPage();
  }

  private loadPuzzle(): void {
    this.data.tile?.load?.()
      .then(component => this.component.set(component))
      .catch(() => this.onLoadError());
  }

  /**
   * Each deploy replaces the hashed puzzle chunks, so a tab opened before a deploy asks for
   * files that no longer exist. One reload picks up the new build; if loading still fails
   * right after that, it's something else (offline, server down), so show an error instead
   * of reloading forever.
   */
  private onLoadError(): void {
    if (this.reloadedRecently()) {
      this.loadFailed.set(true);
      return;
    }
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // Without storage there's no loop guard, so don't risk reloading.
      this.loadFailed.set(true);
      return;
    }
    this.reloadPage();
  }

  private reloadedRecently(): boolean {
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY));
      return Number.isFinite(last) && Date.now() - last < RELOAD_WINDOW_MS;
    } catch {
      return true;
    }
  }

  protected reloadPage(): void {
    location.reload();
  }
}
