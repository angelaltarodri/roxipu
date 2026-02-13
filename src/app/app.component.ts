import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';

type Cell = 0 | 1;
type Direction = 'up' | 'down' | 'left' | 'right';

// 👇 Constante (array de arrays 0/1) para renderizar monedas (filas x columnas).
const COIN_GRID = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
] as const satisfies readonly (readonly Cell[])[];

const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  up: { dr: -1, dc: 0 }
};

const ROTATION_DEG: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270
};

// En turbo avanzamos 1 celda por tick, pero con la mitad del intervalo (más rápido).
const TURBO_TICK_MS = 40;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  readonly cellSizePx = 48;

  // Coin GIF (1 = coin, 0 = vacío/negro)
  readonly coinUrl =
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjIzd3UyZjM4MG90eGEwdHN1NzhxZHFjcmJvMmdwc3o1cmZvOWRoaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/njON3jEmTYHEfRbfsk/giphy.gif';

  // Pacman “emoji” (GIF)
  readonly pacmanUrl =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/912d9e1a-454b-42c2-84e6-fb7a7f5f174f/diyx8o6-f03215ba-a1f8-4500-9e91-29e69a259f09.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi85MTJkOWUxYS00NTRiLTQyYzItODRlNi1mYjdhN2Y1ZjE3NGYvZGl5eDhvNi1mMDMyMTViYS1hMWY4LTQ1MDAtOWU5MS0yOWU2OWEyNTlmMDkuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.AKR1EnfuUK-K4logwY06HzMp25kca-IZQi4YtSo90sc';

  // Nube de polvo (PNG) para modo turbo
  readonly dustUrl =
    'https://static.vecteezy.com/system/resources/thumbnails/014/500/568/small/white-cloud-cutout-on-the-background-and-texture-png.png';

  coins: Cell[][] = this.cloneGrid(COIN_GRID);

  pacRow = 1;
  pacCol = 1;
  direction: Direction = 'right';
  score = 0;
  turboActive = false;
  private turboIntervalId: number | null = null;

  get rows(): number {
    return this.coins.length;
  }

  get cols(): number {
    return this.coins[0]?.length ?? 0;
  }

  get gridTemplateColumns(): string {
    return `repeat(${this.cols}, ${this.cellSizePx}px)`;
  }

  get pacmanTransform(): string {
    const x = this.pacCol * this.cellSizePx;
    const y = this.pacRow * this.cellSizePx;
    const angle = ROTATION_DEG[this.direction];
    return `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
  }

  get dustVisible(): boolean {
    if (!this.turboActive) {
      return false;
    }
    const { dr, dc } = DIR_DELTA[this.direction];
    const dustRow = this.pacRow - dr;
    const dustCol = this.pacCol - dc;
    return dustRow >= 0 && dustRow < this.rows && dustCol >= 0 && dustCol < this.cols;
  }

  get dustTransform(): string {
    const { dr, dc } = DIR_DELTA[this.direction];
    const dustRow = this.pacRow - dr;
    const dustCol = this.pacCol - dc;
    const x = dustCol * this.cellSizePx;
    const y = dustRow * this.cellSizePx;
    return `translate3d(${x}px, ${y}px, 0) scale(0.95)`;
  }

  get coinsLeft(): number {
    return this.coins.reduce(
      (accRow, row) =>
        accRow + row.reduce<number>((acc, cell) => acc + (cell === 1 ? 1 : 0), 0),
      0
    );
  }

  constructor() {
    this.collectCoinIfAny();
  }

  ngOnDestroy(): void {
    this.stopTurbo();
  }

  reset(): void {
    this.coins = this.cloneGrid(COIN_GRID);
    this.pacRow = 1;
    this.pacCol = 1;
    this.direction = 'right';
    this.score = 0;
    this.turboActive = false;
    this.stopTurbo();
    this.collectCoinIfAny();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      if (this.turboActive) {
        return;
      }
      this.turboActive = true;
      this.tickTurbo();
      this.startTurbo();
      return;
    }

    const key = event.key;
    let nextDir: Direction | null = null;
    switch (key) {
      case 'ArrowUp':
        nextDir = 'up';
        break;
      case 'ArrowDown':
        nextDir = 'down';
        break;
      case 'ArrowLeft':
        nextDir = 'left';
        break;
      case 'ArrowRight':
        nextDir = 'right';
        break;
      default:
        return;
    }

    event.preventDefault();
    this.direction = nextDir;
    if (!this.turboActive) {
      this.moveSteps(nextDir, 1);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.code !== 'Space') {
      return;
    }
    event.preventDefault();
    this.turboActive = false;
    this.stopTurbo();
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.turboActive = false;
    this.stopTurbo();
  }

  private startTurbo(): void {
    if (this.turboIntervalId !== null) {
      return;
    }
    this.turboIntervalId = window.setInterval(() => this.tickTurbo(), TURBO_TICK_MS);
  }

  private stopTurbo(): void {
    if (this.turboIntervalId === null) {
      return;
    }
    window.clearInterval(this.turboIntervalId);
    this.turboIntervalId = null;
  }

  private tickTurbo(): void {
    if (!this.turboActive) {
      return;
    }
    this.moveSteps(this.direction, 1);
  }

  private moveSteps(direction: Direction, steps: number): void {
    const { dr, dc } = DIR_DELTA[direction];
    for (let i = 0; i < steps; i++) {
      const nextRow = this.pacRow + dr;
      const nextCol = this.pacCol + dc;

      // Pacman solo se mueve dentro del rectángulo (filas x columnas).
      if (nextRow < 0 || nextRow >= this.rows || nextCol < 0 || nextCol >= this.cols) {
        break;
      }

      this.pacRow = nextRow;
      this.pacCol = nextCol;
      this.collectCoinIfAny();
    }
  }

  private collectCoinIfAny(): void {
    const cell = this.coins[this.pacRow]?.[this.pacCol];
    if (cell !== 1) {
      return;
    }

    this.coins[this.pacRow][this.pacCol] = 0;
    this.score += 1;
  }

  private cloneGrid(grid: readonly (readonly Cell[])[]): Cell[][] {
    return grid.map((row) => [...row]);
  }
}
