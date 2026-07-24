import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CAP_RADIUS, STRAIGHT_LENGTH, TOKEN_DIAMETER, TURNTABLE_SIZE, TURNTABLE_START, slotPosition, solvedCells, trackStep } from '../top-spin-logic';

interface MiniToken {
  value: number;
  left: number;
  top: number;
  inTurntable: boolean;
}

// Full path footprint in logic units (see top-spin-logic.ts): the straight
// plus a cap radius on either end, and twice the cap radius top-to-bottom.
const PATH_WIDTH = STRAIGHT_LENGTH + 2 * CAP_RADIUS;

@Component({
  selector: 'app-top-spin-logo',
  standalone: true,
  templateUrl: './top-spin-logo.html',
  styleUrl: './top-spin-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact',
  },
})
export class TopSpinLogoComponent {
  @Input() compact = false;

  // A static, solved-order snapshot of the real board (see top-spin.ts),
  // shrunk down as a decorative stand-in for the old text logo. Pixels per
  // logic unit; picked so the oval reads clearly at tile size without the
  // tokens overlapping.
  private readonly scale = 0.42;
  private readonly capScaled = CAP_RADIUS * this.scale;

  readonly tokenDiameter = TOKEN_DIAMETER * this.scale;
  readonly boardWidth = PATH_WIDTH * this.scale + this.tokenDiameter;

  // Same formula the real board uses (top-spin.ts turntableDiameterPx): wide
  // enough that its window genuinely spans all 4 turntable-slot tokens,
  // rather than just a decoratively-sized circle behind them.
  readonly turntableDiameter = (TURNTABLE_SIZE - 1) * trackStep() * this.scale + this.tokenDiameter;

  // The board isn't vertically symmetric once the turntable is sized to fit:
  // it straddles the top straight (see top-spin.ts: "flip vertically so the
  // turntable sits on the top straight") and overhangs further than a token
  // does on the bottom straight, so the two sides need their own padding
  // rather than a single centred boardHeight.
  private readonly topPad = this.turntableDiameter / 2;
  private readonly bottomPad = this.tokenDiameter / 2;
  readonly boardHeight = 2 * this.capScaled + this.topPad + this.bottomPad;
  private readonly centerY = this.capScaled + this.topPad;

  readonly turntableLeft = this.boardWidth / 2 - this.turntableDiameter / 2;
  readonly turntableTop = this.centerY - this.capScaled - this.turntableDiameter / 2;

  // The grey track should hug the oval the token centres actually trace
  // (cap radius plus a token's own radius), not the full bounding box -
  // that box is taller than the oval so it can also fit the turntable's
  // overhang above the top straight. Sizing the track to the box instead
  // would stretch it past the tokens and leave the turntable flush against
  // its edge with no margin.
  readonly trackHeight = 2 * this.capScaled + this.tokenDiameter;
  readonly trackTop = this.centerY - this.trackHeight / 2;

  readonly tokens: MiniToken[] = solvedCells().map((value, index) => {
    const { x, y } = slotPosition(index);
    const inTurntable = index >= TURNTABLE_START && index < TURNTABLE_START + TURNTABLE_SIZE;
    return {
      value,
      left: this.boardWidth / 2 + x * this.scale - this.tokenDiameter / 2,
      top: this.centerY - y * this.scale - this.tokenDiameter / 2,
      inTurntable,
    };
  });
}
