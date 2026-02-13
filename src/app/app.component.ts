import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

type Cell = 0 | 1;
type Direction = 'up' | 'down' | 'left' | 'right';

// 👇 Constante (array de arrays 0/1) para renderizar monedas (filas x columnas).
const COIN_GRID = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
] as const satisfies readonly (readonly Cell[])[];

const ROTATION_DEG: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly cellSizePx = 48;

  // Coin GIF (1 = coin, 0 = vacío/negro)
  readonly coinUrl =
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjIzd3UyZjM4MG90eGEwdHN1NzhxZHFjcmJvMmdwc3o1cmZvOWRoaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/njON3jEmTYHEfRbfsk/giphy.gif';

  // Pacman “emoji” (GIF)
  readonly pacmanUrl =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/912d9e1a-454b-42c2-84e6-fb7a7f5f174f/diyx8o6-f03215ba-a1f8-4500-9e91-29e69a259f09.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi85MTJkOWUxYS00NTRiLTQyYzItODRlNi1mYjdhN2Y1ZjE3NGYvZGl5eDhvNi1mMDMyMTViYS1hMWY4LTQ1MDAtOWU5MS0yOWU2OWEyNTlmMDkuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.AKR1EnfuUK-K4logwY06HzMp25kca-IZQi4YtSo90sc';

  coins: Cell[][] = this.cloneGrid(COIN_GRID);

  pacRow = 1;
  pacCol = 1;
  direction: Direction = 'right';
  score = 0;

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

  reset(): void {
    this.coins = this.cloneGrid(COIN_GRID);
    this.pacRow = 1;
    this.pacCol = 1;
    this.direction = 'right';
    this.score = 0;
    this.collectCoinIfAny();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight'
    ) {
      return;
    }

    event.preventDefault();

    let nextRow = this.pacRow;
    let nextCol = this.pacCol;
    let nextDir: Direction = this.direction;

    switch (key) {
      case 'ArrowUp':
        nextRow -= 1;
        nextDir = 'up';
        break;
      case 'ArrowDown':
        nextRow += 1;
        nextDir = 'down';
        break;
      case 'ArrowLeft':
        nextCol -= 1;
        nextDir = 'left';
        break;
      case 'ArrowRight':
        nextCol += 1;
        nextDir = 'right';
        break;
    }

    // Pacman solo se mueve dentro del rectángulo (filas x columnas).
    if (nextRow < 0 || nextRow >= this.rows || nextCol < 0 || nextCol >= this.cols) {
      return;
    }

    this.pacRow = nextRow;
    this.pacCol = nextCol;
    this.direction = nextDir;

    this.collectCoinIfAny();
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
