---
name: add-puzzle
description: >
  Step-by-step guide for adding a new puzzle to the rbrock44/puzzles
  Angular app. Use this skill whenever the user asks to create, add, or scaffold
  a new puzzle, game, or brain-teaser in this project.
---

# Adding a New Puzzle to the Puzzles App

This Angular app uses **standalone components**, `ChangeDetectionStrategy.OnPush`, and no Angular routing for puzzles. They're shown/hidden via `SettingsService.getSelectedTile()` string key. There is no "minimal example" component in the codebase to copy anymore (the old auto-generated `sliding-puzzle` was deleted for causing confusion), use **`rack-em-up`** and **`top-spin`** (both under `src/app/components/classic-puzzles/`) as the real reference implementations. Follow every step below in order.

---

## Step 1 — Decide the puzzle's details

Gather (or ask the user for) these things before writing any code:

| Field | Example |
|---|---|
| **Display title** | `Rack 'em Up` |
| **In-app subtitle** (shown under the title, optional) | `A Puzzle to Spin You in Circles!` |
| **Tile description** (shown on the home-grid tile) | `Tilt and shift to sort the balls into solid-colour rows` |
| **Icon** | An emoji (e.g. `🧩`) for the simple path, **or** a custom animated logo — see [Advanced pattern: custom tile logo](#advanced-pattern-custom-tile-logo--mini-logo) |
| **URL param / tile key** (kebab-case, plus a short 2-3 letter alias) | `rack-em-up` / `reu` |
| **Category** | `Handheld Puzzles` (existing) or a new category name |
| **Component folder name** | `rack-em-up` |
| **Angular selector** | `app-rack-em-up` |
| **TypeScript class name** | `RackEmUpComponent` |
| **Does it have a "moves" win condition worth ranking?** | If yes, wire up persistence + high scores (Step 2b). If the puzzle has no natural score metric, skip that part. |

Component folders live under `src/app/components/<category-kebab>/` (the existing folder is `classic-puzzles`, even though the category's *display* name is `Handheld Puzzles` — folder naming and category display name are independent).

---

## Step 2 — Create the component folder and files

Create the directory:
```
src/app/components/<category-kebab>/<component-folder>/
```

At minimum, create **three files** inside it: `<name>.ts`, `<name>.html`, `<name>.scss`. If the puzzle has non-trivial game logic (board generation, move validation, win detection), split it into a separate pure-function file — see `rack-em-up-logic.ts` / `top-spin-logic.ts` — and keep the component itself focused on state/wiring. Add `<name>-solver.ts` only if you're building an [auto-solver](#advanced-pattern-auto-solver).

### Core component shape (`<name>.ts`)

Both real puzzles share this shape: a three-way `GAME_VIEW` (`play` / `info` / `scores`) toggle, an `INFO_COLUMNS` strategy panel, a `moves` counter, and a `categoryName` pulled from `SettingsService`.

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoColumn } from '../../../objects/info';
import { GAME_VIEW, GameView } from '../../../objects/game';
import { SettingsService } from '../../../services/settings';
import { HighScoresPanelComponent } from '../../high-scores-panel/high-scores-panel';
import { SaveScoreComponent } from '../../save-score/save-score';
// only if you're doing persistence/high scores — see Step 2b:
// import { GameStateService } from '../../../services/game-state';
// import { HighScoreService } from '../../../services/high-score';

const TILE_PARAM = '<tile-key>';

const INFO_COLUMNS: InfoColumn[] = [
  {
    h2: 'The Moves',
    p: [
      { strong: 'Move name', text: 'what this move does and why it matters.' },
    ],
  },
  {
    h2: 'Strategy',
    trivia: 'Optional fun fact, shown below the strategy tips.',
    p: [
      { text: 'A tip for solving the puzzle.' },
    ],
  },
];

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule, HighScoresPanelComponent, SaveScoreComponent],
  templateUrl: './<name>.html',
  styleUrl: './<name>.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <ClassName>Component {
  readonly GAME_VIEW = GAME_VIEW;
  readonly INFO_COLUMNS = INFO_COLUMNS;
  readonly TILE_PARAM = TILE_PARAM;
  readonly categoryName: string;

  private settingsService = inject(SettingsService);

  constructor() {
    this.categoryName = this.settingsService.getCategoryName(TILE_PARAM);
  }

  view = signal<GameView>(GAME_VIEW.PLAY);
  moves = signal<number>(0);

  isSolved = computed<boolean>(() => /* derive from board state */ false);

  toggleView(): void {
    this.view.set(this.view() === GAME_VIEW.INFO ? GAME_VIEW.PLAY : GAME_VIEW.INFO);
  }

  toggleScores(): void {
    this.view.set(this.view() === GAME_VIEW.SCORES ? GAME_VIEW.PLAY : GAME_VIEW.SCORES);
  }

  newGame(): void {
    this.moves.set(0);
    // reset board state here
  }
}
```

Key conventions:
- Always `standalone: true` and `changeDetection: ChangeDetectionStrategy.OnPush`.
- Use `signal()` / `computed()` for all puzzle state, never plain fields.
- Use Angular's built-in control flow (`@if`, `@for`, `@switch`) — **never** `*ngIf` / `*ngFor`.
- `SIDE`, `DIRECTION`, `GAME_VIEW`, `SOLVER_STATE` are shared const-object "enums" in `src/app/objects/game.ts` — reuse them instead of inventing new string literals when your puzzle has directional or view-state concepts.
- `item.text` and `column.trivia` in the info panel are bound with `[innerHTML]` — only ever put static, developer-authored copy there, never user input.

### `<name>.html` — Template

Wrap content in a `<section class="widget-container">` with a `view-header` (eyebrow/title/description + Info/High Scores buttons) and a `GAME_VIEW` switch:

```html
<section class="widget-container" [class.wide]="view() === GAME_VIEW.INFO" [class.scores-wide]="view() === GAME_VIEW.SCORES">
  <div class="view-header">
    <div>
      <p class="eyebrow">{{ categoryName }}</p>
      <h1>Puzzle Title</h1>
      <p class="description">One-line description of the puzzle.</p>
    </div>
    <div class="header-actions">
      <button type="button" class="info-btn" (click)="toggleScores()" [attr.aria-pressed]="view() === GAME_VIEW.SCORES">
        @if (view() === GAME_VIEW.SCORES) { Back } @else { High Scores }
      </button>
      <button type="button" class="info-btn" (click)="toggleView()" [attr.aria-pressed]="view() === GAME_VIEW.INFO">
        @if (view() === GAME_VIEW.INFO) { Back } @else { Info }
      </button>
    </div>
  </div>

  @if (view() === GAME_VIEW.SCORES) {
    <app-high-scores-panel [puzzle]="TILE_PARAM" (back)="toggleScores()"></app-high-scores-panel>
  } @else if (view() === GAME_VIEW.INFO) {
    <div class="info-panel">
      <p class="description">Longer explanation of the rules.</p>
      <div class="info-columns">
        @for (column of this.INFO_COLUMNS; track $index) {
          <div class="info-col">
            <h2>{{ column.h2 }}</h2>
            @for (item of column.p; track $index) {
              <p>
                @if (item?.strong) { <strong>{{ item.strong }}</strong> &mdash; }
                <span [innerHTML]="item.text"></span>
              </p>
            }
            @if (column?.trivia) {
              <p class="trivia" [innerHTML]="column.trivia"></p>
            }
          </div>
        }
      </div>
    </div>
    <button type="button" class="new-game-btn" (click)="toggleView()">Back to game</button>
  } @else {
    <div class="meta-row">
      <div class="game-actions">
        <button type="button" class="new-game-btn" (click)="newGame()">New game</button>
      </div>
      <span class="moves">Moves <strong>{{ moves() }}</strong></span>
    </div>

    @if (isSolved()) {
      <p class="solved-banner" aria-live="polite">Solved in {{ moves() }} moves!</p>
      <!-- only if wired up in Step 2b: -->
      <!-- <app-save-score [saved]="scoreSaved()" (save)="saveScore($event)"></app-save-score> -->
    }

    <!-- puzzle board / controls -->
  }
</section>
```

If the puzzle doesn't need an info panel or high scores, it's fine to drop those branches and keep just a play view — but keep the `widget-container` / `view-header` shell for visual consistency.

### `<name>.scss` — Styles

**Use the app's CSS custom properties, never hardcoded hex colors** — the app supports light/dark themes via `data-theme` on `<html>` (see `src/styles.scss` and `ThemeService`), and hardcoded colors will break in dark mode.

```scss
.widget-container {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  padding: 1.5rem 1.75rem;
  background: var(--paper-raised);
  border: 1px solid var(--paper-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: max-width 0.2s ease;
}

.widget-container.wide { max-width: 840px; }     // info view
.widget-container.scores-wide { max-width: 530px; } // scores view

.eyebrow {
  margin: 0 0 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

h1 { font-size: 1.4rem; font-weight: 600; }

.description { margin-top: 0.4rem; color: var(--ink-soft); font-size: 0.92rem; }

.solved-banner { margin-top: 0.75rem; color: var(--ink); font-weight: 700; }
```

Available tokens (`src/styles.scss`), all theme-aware except the accent colors:
| Token | Purpose |
|---|---|
| `--paper`, `--paper-raised`, `--paper-line` | page background, card background, border/hairline |
| `--ink`, `--ink-soft`, `--ink-faint` | primary / secondary / tertiary text |
| `--amber`, `--amber-deep`, `--amber-tint`, `--amber-ink`, `--coral` | fixed accent colors (same in both themes) |
| `--spin-purple`, `--spin-purple-deep`, `--spin-yellow`, `--spin-yellow-deep`, `--spin-frame`, `--spin-frame-deep` | Top Spin's toy-accurate accents — don't reuse these for a new puzzle, add your own puzzle-specific accent vars instead if needed |
| `--font-display`, `--font-body`, `--font-mono` | Fraunces (headings), Inter (body), JetBrains Mono (eyebrows/mono labels) |
| `--radius-sm` (8px), `--radius-md` (14px) | corner radii |
| `--shadow-sm`, `--shadow-md`, `--shadow-lg` | elevation |

- **No external UI libraries for puzzle boards** — hand-written SCSS only (Angular Material is available globally for form controls if a puzzle needs them).
- Per-component style budget is 8kB (warns, doesn't fail the build) — both existing puzzles are already slightly over on warning, so don't worry about a small overage, but don't go far past it either.

---

## Step 2b — (Optional) Persistence + High Scores

Both `rack-em-up` and `top-spin` persist game state to `localStorage` and let the player save a ranked score once solved. Do this if the puzzle has a natural "fewer moves is better" win condition; skip it for puzzles without one.

```typescript
import { GameStateService } from '../../../services/game-state';
import { HighScoreService } from '../../../services/high-score';

interface <Name>SaveState {
  // whatever board-state fields need to survive a reload
  moves: number;
  gameId: string;
}

private gameState = inject(GameStateService);
private highScoreService = inject(HighScoreService);
private storageKey = this.settingsService.getStorageKey(TILE_PARAM);
private saved = this.gameState.load<<Name>SaveState>(this.storageKey);

constructor() {
  // ...
  effect(() => {
    this.gameState.save<<Name>SaveState>(this.storageKey, {
      moves: this.moves(),
      gameId: this.gameId(),
    });
  });

  effect(() => {
    const gameId = this.gameId();
    this.highScoreService.hasScoreForGame(TILE_PARAM, gameId).then(saved => {
      if (this.gameId() === gameId) {
        this.scoreSaved.set(saved);
      }
    });
  });
}

gameId = signal<string>(this.saved?.gameId ?? crypto.randomUUID());
scoreSaved = signal<boolean>(false);

async saveScore(initials: string): Promise<void> {
  if (this.scoreSaved() || !this.isSolved()) {
    return;
  }
  await this.highScoreService.submitScore(TILE_PARAM, this.moves(), 'Solved', initials, this.gameId());
  this.scoreSaved.set(true);
}
```

Notes:
- `GameStateService.save`/`load` is a thin `localStorage` JSON wrapper — nothing puzzle-specific to configure.
- `HighScoreService.submitScore(puzzle, moves, winType, initials, gameId)` HMAC-signs each entry (see `src/app/services/high-score.ts`) so scores can't be forged via devtools; `winType` is a free-text label shown next to the score (e.g. `'Solved'`, or a named mode like Top Spin's `'Unscramble'`) — **don't modify the signing logic**, it's shared across every puzzle's scores.
- Reset `gameId` to a new `crypto.randomUUID()` and `moves` to `0` inside `newGame()`.
- If a puzzle has an auto-solver (see below), guard `saveScore` so auto-solved games don't get a score.

---

## Step 3 — Register the component in `src/app/app.ts`

1. Add an import at the top with the other puzzle imports:
   ```typescript
   import { <ClassName>Component } from './components/<category>/<folder>/<name>';
   ```
2. Add the class to the `imports` array of the `@Component` decorator.

---

## Step 4 — Add the route condition to `src/app/app.html`

Inside the outer `@if (this.settingsService.getSelectedTile() !== null)` block, add a new `@if` matching both the full tile key and a short 2-3 letter alias (the existing convention, e.g. `"rack-em-up" || "reu"`):

```html
@if (this.settingsService.getSelectedTile() === "<tile-key>" || this.settingsService.getSelectedTile() === "<short-alias>") {
  <app-<name>></app-<name>>
}
```

---

## Step 5 — Add the tile to `src/app/constants/categories.ts`

Add an entry to the appropriate category's `tiles` array (see `src/app/objects/tile.ts` for the full `Tile` interface). If the category doesn't exist yet, add a new category object.

```typescript
{
  title: '<Display Title>',
  description: '<Short description shown on the tile>',
  icon: '<emoji>',           // '' if using a custom logo component instead — see Advanced pattern
  param: '<tile-key>',
  storageKey: 'puzzles-<tile-key>', // only needed if you wired up Step 2b
  // centered: true,          // optional — use with a custom logo (see Advanced pattern)
  // className: 'tile-<name>' // optional — puzzle-specific tile styling hook
}
```

The `param` value must exactly match the tile-key string used in `app.html`'s `@if` condition.

---

## Step 6 — Build and test to verify

From `C:\workspace\puzzles`, run:
```
npm run build
npm run test
```
The build must complete with **exit code 0** (SCSS budget warnings are acceptable, errors are not). Tests must pass — `src/app/app.spec.ts` has a "tile selected → correct component renders" test per puzzle; add one for the new puzzle following that pattern. Fix any TypeScript or template compilation errors before considering the task done.

---

## Advanced pattern: auto-solver

Both `rack-em-up` and `top-spin` offer an "Auto-Solve" button. If the puzzle warrants one:

- Put the search algorithm in `<name>-solver.ts`, exporting a `solve<Name>(...)` function returning a move list (or `null`/empty if already solved) — see `top-spin-solver.ts` for an A*-style weighted-heuristic search with tiered expansion budgets, and `rack-em-up-solver.ts` for the same idea applied to that puzzle.
- Use the shared `SOLVER_STATE` enum (`IDLE` / `COMPUTING` / `SOLVING` / `DONE`) from `src/app/objects/game.ts` to drive UI state, and `isLocked = computed(() => solverState() !== SOLVER_STATE.IDLE)` to disable manual controls while solving.
- Show a confirm dialog (`showSolveConfirm` signal) before starting — auto-solving is irreversible mid-puzzle and disqualifies the game from high scores (`wasAutoSolved = computed(() => solverState() === SOLVER_STATE.DONE)`, checked in `saveScore`).
- Defer the actual search inside `setTimeout(..., 0)` so the "Solving…" state has a chance to render before a potentially heavy synchronous search runs, then play back moves one at a time via a recursive `setTimeout` loop (`AUTO_SOLVE_MOVE_DELAY_MS` from the puzzle's `-logic.ts` file), and clear the timer in `ngOnDestroy`.

---

## Advanced pattern: custom tile logo + mini-logo

Instead of an emoji `icon`, both `rack-em-up` and `top-spin` render an animated SVG "logo" component both on their own board (full-size) and on their home-grid tile (compact). This is more work — only do it if the puzzle's visual identity warrants it.

1. Create `<name>-logo/<name>-logo.ts` (+ `.html`/`.scss`) with a `compact` `@Input()` (and optionally `textLogoOnly`) toggled via a `[class.compact]` host binding, so one component serves both the full board header and the small tile icon.
2. Use it inside the puzzle's own template (e.g. `<app-<name>-logo class="board-logo" aria-hidden="true">`).
3. Wire it into the home-grid tile — this requires editing shared files, not just the new puzzle's folder:
   - `src/app/components/tile/tile.ts`: import the logo component and add it to `imports`.
   - `src/app/components/tile/tile.html`: add an `@else if (tile.param === '<tile-key>')` branch rendering `<app-<name>-logo class="tile-logo" [compact]="true">` before the generic emoji-badge fallback.
4. In `categories.ts`, set `icon: ''` and add `centered: true` plus a `className: 'tile-<name>'` hook if the tile needs custom sizing/background (see `tile.scss` for existing `.tile-rack-em-up` / `.tile-top-spin` rules).

This is the one place where adding a puzzle touches shared components outside its own folder beyond `app.ts`/`app.html`/`categories.ts` — keep the `@if`/`@else if` chain in `tile.html` in sync with however many puzzles use a custom logo.

---

## File-naming conventions

| Thing | Convention |
|---|---|
| Folder name | `kebab-case` |
| File names | `kebab-case` (e.g. `rack-em-up.ts`, `rack-em-up-logic.ts`, `rack-em-up-solver.ts`) |
| Selector | `app-<kebab-case>` |
| Class name | `PascalCaseComponent` |
| Tile key (`param`) | `kebab-case`, e.g. `rack-em-up`, `top-spin` |
| Short alias (checked alongside the tile key in `app.html`) | `2-3 lowercase letters`, e.g. `reu`, `ts` |
