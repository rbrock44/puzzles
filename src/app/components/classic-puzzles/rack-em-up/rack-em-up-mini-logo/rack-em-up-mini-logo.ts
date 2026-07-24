import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RackEmUpLogoComponent } from '../rack-em-up-logo/rack-em-up-logo';
import { Cell, COLS, LEFT_COL, RIGHT_COL, VISUAL_ROWS } from '../rack-em-up-logic';

interface MiniCell {
  // A middle-column corner: never holds a ball, shown as a greyed hatch
  // block rather than an open slot (see rack-em-up.scss .cell-slot.wall).
  filler: boolean;
  color: Cell;
}

@Component({
  selector: 'app-rack-em-up-mini-logo',
  standalone: true,
  imports: [RackEmUpLogoComponent],
  templateUrl: './rack-em-up-mini-logo.html',
  styleUrl: './rack-em-up-mini-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact',
  },
})
export class RackEmUpMiniLogoComponent {
  @Input() compact = false;

  // A static, solved-order snapshot of the real board (see rack-em-up.ts
  // visualBoard, with plngl = plngr = 0 so both edge columns sit centred):
  // the same VISUAL_ROWS x COLS footprint, but since there's no shift here,
  // the edge columns' extra top/bottom row is always the "disconnected"
  // case - rendered as an open available slot (reusing the blank-ball look)
  // rather than the real board's wall hatching, since nothing is actually
  // broken here, it's just showing where the column can shift to.
  readonly grid: MiniCell[] = (() => {
    const cells: MiniCell[] = [];
    for (let vr = 0; vr < VISUAL_ROWS; vr++) {
      const isExtraRow = vr === 0 || vr === VISUAL_ROWS - 1;
      for (let col = 0; col < COLS; col++) {
        const isEdge = col === LEFT_COL || col === RIGHT_COL;
        if (isExtraRow) {
          cells.push({ filler: !isEdge, color: null });
        } else {
          cells.push({ filler: false, color: col === RIGHT_COL ? null : vr - 1 });
        }
      }
    }
    return cells;
  })();
}
