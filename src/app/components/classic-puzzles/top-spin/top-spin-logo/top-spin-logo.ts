import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CAP_RADIUS, STRAIGHT_LENGTH, TOKEN_DIAMETER, TURNTABLE_SIZE, TURNTABLE_START, slotPosition, solvedCells, trackStep } from '../top-spin-logic';

interface MiniToken {
  value: number;
  left: number;
  top: number;
  inTurntable: boolean;
}

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
  @Input() textLogoOnly = false;

  private readonly scale = 0.42;
  private readonly capScaled = CAP_RADIUS * this.scale;

  readonly tokenDiameter = TOKEN_DIAMETER * this.scale;
  readonly boardWidth = PATH_WIDTH * this.scale + this.tokenDiameter;

  readonly turntableDiameter = (TURNTABLE_SIZE - 1) * trackStep() * this.scale + this.tokenDiameter;

  private readonly topPad = this.turntableDiameter / 2;
  private readonly bottomPad = this.tokenDiameter / 2;
  readonly boardHeight = 2 * this.capScaled + this.topPad + this.bottomPad;
  private readonly centerY = this.capScaled + this.topPad;

  readonly turntableLeft = this.boardWidth / 2 - this.turntableDiameter / 2;
  readonly turntableTop = this.centerY - this.capScaled - this.turntableDiameter / 2;

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
