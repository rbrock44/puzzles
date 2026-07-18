---
name: add-puzzle
description: >
  Step-by-step guide for adding a new puzzle to the rbrock44/puzzles
  Angular app. Use this skill whenever the user asks to create, add, or scaffold
  a new puzzle, game, or brain-teaser in this project.
---

# Adding a New Puzzle to the Puzzles App

This Angular app uses **standalone components**, `ChangeDetectionStrategy.OnPush`, and no routing — puzzles are shown/hidden via a `SettingsService.getSelectedTile()` string key. Follow every step below in order.

---

## Step 1 — Decide the puzzle's details

Gather (or ask the user for) these four things before writing any code:

| Field | Example |
|---|---|
| **Display title** | `Sliding Puzzle` |
| **Short description** (tile subtitle) | `Slide numbered tiles into order, one move at a time` |
| **Emoji icon** | `🧩` |
| **URL param / tile key** (2-4 lowercase letters) | `sp` |
| **Category** | `Classic Puzzles` (or `Word Puzzles`, `Logic Puzzles`, …) |
| **Component folder name** | `sliding-puzzle` |
| **Angular selector** | `app-sliding-puzzle` |
| **TypeScript class name** | `SlidingPuzzleComponent` |

Component folders live under `src/app/components/<category-kebab>/`.

---

## Step 2 — Create the component folder and three files

Create the directory:
```
src/app/components/<category>/<component-folder>/
```

Create exactly **three files** inside it:

### `<name>.ts` — Component class

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<name>.html',
  styleUrl: './<name>.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <ClassName>Component {
  // puzzle state and logic here — prefer signals for state
}
```

Key conventions:
- Always `standalone: true`
- Always `changeDetection: ChangeDetectionStrategy.OnPush`
- Prefer `signal()` / `computed()` for puzzle state over plain fields
- Import `FormsModule` whenever you use `[(ngModel)]`
- Use Angular 17+ control flow syntax (`@if`, `@for`, `@switch`) — **never** `*ngIf` / `*ngFor`

### `<name>.html` — Template

Wrap content in a `<section>` with class `widget-container`:

```html
<section class="widget-container">
  <h2>Puzzle Title</h2>
  <p class="description">One-line description of the puzzle.</p>

  <!-- puzzle board / controls -->

  <!-- @if (isSolved()) { -->
  <!--   <p class="solved-banner" aria-live="polite">Solved! 🎉</p> -->
  <!-- } -->
</section>
```

### `<name>.scss` — Styles

Base scaffold to copy and extend:

```scss
.widget-container {
  max-width: 800px;
  margin: 1rem auto;
  padding: 1rem;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

h2 {
  margin: 0;
  color: #1f2937;
}

.description {
  margin-top: 0.4rem;
  color: #4b5563;
}

.solved-banner {
  margin-top: 0.75rem;
  color: #075985;
  font-weight: 700;
}

@media (max-width: 480px) {
  .widget-container {
    margin: 0.5rem;
    padding: 0.75rem;
  }
}
```

---

## Step 3 — Register the component in `src/app/app.ts`

1. Add an import at the top with the other component imports:
   ```typescript
   import { <ClassName>Component } from './components/<category>/<folder>/<name>';
   ```

2. Add the class to the `imports` array of the `@Component` decorator (keep the list alphabetical by class name or grouped by category — match the existing order):
   ```typescript
   imports: [
     // ... existing imports ...
     <ClassName>Component,
     // ...
   ]
   ```

---

## Step 4 — Add the route condition to `src/app/app.html`

Inside the outer `@if (this.settingsService.getSelectedTile() !== null)` block, add a new `@if` for the new puzzle's tile key, **before** the closing `}`:

```html
@if (this.settingsService.getSelectedTile() === "<tile-key>") {
  <app-<name>></app-<name>>
}
```

---

## Step 5 — Add the tile to `src/app/constants/categories.ts`

Add an entry to the appropriate category's `tiles` array. If the category doesn't exist yet, add a new category object:

```typescript
{
  name: '<Category Name>',
  tiles: [
    {
      title: '<Display Title>',
      description: '<Short description shown on the tile>',
      icon: '<emoji>',
      param: '<tile-key>'
    }
  ]
}
```

The `param` value must exactly match the string used in `app.html`'s `@if` condition.

---

## Step 6 — Build to verify

Run:
```
npm run build
```
from `C:\workspace\puzzles`. The build must complete with **exit code 0** (warnings are acceptable, errors are not). Fix any TypeScript or template compilation errors before considering the task done.

---

## Design conventions to follow

- **Color palette**: blues (`#2563eb`, `#1e3a8a`, `#dbeafe`), neutrals (`#1f2937`, `#4b5563`, `#e2e8f0`), error red (`#b91c1c`)
- **Border radius**: `8px` for inputs/buttons, `10px` for cards/containers
- **Buttons**: solid blue (`#2563eb`) for primary actions
- **Typography**: system font stack (inherited from global styles); `font-weight: 600` for labels; `font-weight: 700` for headings and strong values
- **Spacing unit**: `0.5rem` multiples
- **No external UI libraries for puzzle boards** — all styles are hand-written SCSS (Angular Material is available globally for form controls if a puzzle needs them)
- **No routing** — puzzles are toggled via `SettingsService`, not Angular Router routes

## File-naming conventions

| Thing | Convention |
|---|---|
| Folder name | `kebab-case` |
| File names | `kebab-case` (e.g. `sliding-puzzle.ts`) |
| Selector | `app-<kebab-case>` |
| Class name | `PascalCaseComponent` |
| Tile key (`param`) | `2-4 lowercase letters` (e.g. `sp`, `wg`, `mm`) |
