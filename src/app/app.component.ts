import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';

type Cell = 0 | 1;
type Direction = 'up' | 'down' | 'left' | 'right';
type GameMode = 'coins' | 'chocolate';
type MusicKind = 'lavida' | 'baazigar';
type Firework = {
  src: string;
  widthPx: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  transform?: string;
};

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
const TURBO_SOUND_START_S = 9;
const CHOCOLATE_BITE_SOUND_DURATION_MS = 120;
const BAAZIGAR_START_S = 1 * 60 + 59;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  readonly cellSizePx = 48;
  extended = false;

  // Coin GIF (1 = coin, 0 = vacío/negro)
  readonly coinUrl =
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjIzd3UyZjM4MG90eGEwdHN1NzhxZHFjcmJvMmdwc3o1cmZvOWRoaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/njON3jEmTYHEfRbfsk/giphy.gif';

  // Pacman “emoji” (GIF)
  readonly pacmanUrl =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/912d9e1a-454b-42c2-84e6-fb7a7f5f174f/diyx8o6-f03215ba-a1f8-4500-9e91-29e69a259f09.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi85MTJkOWUxYS00NTRiLTQyYzItODRlNi1mYjdhN2Y1ZjE3NGYvZGl5eDhvNi1mMDMyMTViYS1hMWY4LTQ1MDAtOWU5MS0yOWU2OWEyNTlmMDkuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.AKR1EnfuUK-K4logwY06HzMp25kca-IZQi4YtSo90sc';

  // Nube de polvo (PNG) para modo turbo
  readonly dustUrl =
    'https://static.vecteezy.com/system/resources/thumbnails/014/500/568/small/white-cloud-cutout-on-the-background-and-texture-png.png';

  // Chocolate (cuando ya no queden monedas)
  readonly chocolateUrl = 'https://cdn-icons-png.flaticon.com/512/3465/3465221.png';

  readonly fireworks: readonly Firework[] = [
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Animated_Fireworks.gif',
      widthPx: 220,
      top: '6%',
      left: '3%',
      opacity: 0.78,
      transform: 'rotate(-8deg)'
    },
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Wikipedia20_animated_Fireworks_1MB.gif',
      widthPx: 170,
      top: '10%',
      right: '4%',
      opacity: 0.9,
      transform: 'rotate(10deg)'
    },
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Feuerwerks-gif.gif',
      widthPx: 200,
      bottom: '8%',
      left: '6%',
      opacity: 0.75,
      transform: 'rotate(6deg)'
    },
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Animated_Fireworks.gif',
      widthPx: 260,
      bottom: '6%',
      right: '5%',
      opacity: 0.68,
      transform: 'rotate(-6deg)'
    },
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Wikipedia20_animated_Fireworks_1MB.gif',
      widthPx: 190,
      top: '42%',
      left: '6%',
      opacity: 0.78,
      transform: 'rotate(-14deg)'
    },
    {
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Feuerwerks-gif.gif',
      widthPx: 180,
      top: '44%',
      right: '7%',
      opacity: 0.78,
      transform: 'rotate(14deg)'
    }
  ];

  coins: Cell[][] = this.cloneGrid(COIN_GRID);
  chocolates: Cell[][] | null = null;

  pacRow = 1;
  pacCol = 1;
  direction: Direction = 'right';
  score = 0;
  turboActive = false;
  private turboIntervalId: number | null = null;
  private turboSound: HTMLAudioElement | null = null;
  private lavidaSong: HTMLAudioElement | null = null;
  private baazigarSong: HTMLAudioElement | null = null;
  private activeSong: MusicKind | null = null;
  private coinSoundPreload: HTMLAudioElement | null = null;
  private chocolateBiteSoundPreload: HTMLAudioElement | null = null;
  private chocolateBiteStopTimeoutId: number | null = null;

  mode: GameMode = 'coins';
  remainingCoins = 0;
  remainingChocolates = 0;

  get rows(): number {
    return this.coins.length;
  }

  get cols(): number {
    return this.coins[0]?.length ?? 0;
  }

  get gridTemplateColumns(): string {
    return `repeat(${this.cols}, ${this.cellSizePx}px)`;
  }

  get boardWidthPx(): number {
    return this.cols * this.cellSizePx;
  }

  get boardHeightPx(): number {
    return this.rows * this.cellSizePx;
  }

  get bgSizePx(): number {
    return Math.min(this.boardWidthPx, this.boardHeightPx);
  }

  get bgOffsetXPx(): number {
    return (this.boardWidthPx - this.bgSizePx) / 2;
  }

  get bgOffsetYPx(): number {
    return (this.boardHeightPx - this.bgSizePx) / 2;
  }

  get bgImageCss(): string {
    return this.extended ? "url('/assets/roxi3.jpeg')" : "url('/assets/quieresser.jpeg')";
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

  get isChocolateMode(): boolean {
    return this.mode === 'chocolate';
  }

  get coinsLeft(): number {
    return this.mode === 'coins' ? this.remainingCoins : 0;
  }

  get chocolatesLeft(): number {
    return this.mode === 'chocolate' ? this.remainingChocolates : 0;
  }

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.turboSound = new Audio('assets/ruido.mp3');
      this.turboSound.preload = 'auto';
      this.turboSound.load();

      this.coinSoundPreload = new Audio('assets/mariocoin.mp3');
      this.coinSoundPreload.preload = 'auto';
      this.coinSoundPreload.load();

      this.chocolateBiteSoundPreload = new Audio('assets/gogo.mp3');
      this.chocolateBiteSoundPreload.preload = 'auto';
      this.chocolateBiteSoundPreload.load();

      this.lavidaSong = new Audio('assets/lavidaesgogo.mp3');
      this.lavidaSong.preload = 'auto';
      this.lavidaSong.loop = true;
      this.lavidaSong.load();

      this.baazigarSong = new Audio('assets/baazigar.mp3');
      this.baazigarSong.preload = 'auto';
      this.baazigarSong.loop = false;
      this.baazigarSong.load();
      this.baazigarSong.addEventListener('ended', () => {
        if (this.activeSong !== 'baazigar') {
          return;
        }
        this.playBaazigarSong();
      });
    }

    this.remainingCoins = this.countOnes(this.coins);
    this.collectIfAny();
  }

  ngOnDestroy(): void {
    this.stopTurbo();
    this.stopTurboSound();
    this.stopBackgroundMusic();
    this.stopChocolateBiteSound();
  }

  reset(): void {
    this.coins = this.cloneGrid(COIN_GRID);
    this.chocolates = null;
    this.extended = false;
    this.pacRow = 1;
    this.pacCol = 1;
    this.direction = 'right';
    this.score = 0;
    this.turboActive = false;
    this.stopTurbo();
    this.stopTurboSound();
    this.stopBackgroundMusic();
    this.stopChocolateBiteSound();

    this.mode = 'coins';
    this.remainingCoins = this.countOnes(this.coins);
    this.remainingChocolates = 0;
    this.collectIfAny();
  }

  toggleExtended(): void {
    this.extended = !this.extended;
    this.syncBackgroundMusic();
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
      this.playTurboSound();
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
    this.stopTurboSound();
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.turboActive = false;
    this.stopTurbo();
    this.stopTurboSound();
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

  private playTurboSound(): void {
    if (!this.turboSound) {
      return;
    }

    this.turboSound.pause();
    try {
      this.turboSound.currentTime = TURBO_SOUND_START_S;
    } catch {
      // Si el metadata aún no cargó, arrancamos desde donde se pueda.
    }
    void this.turboSound.play().catch(() => undefined);
  }

  private stopTurboSound(): void {
    if (!this.turboSound) {
      return;
    }
    this.turboSound.pause();
  }

  private playChocolateBiteSound(): void {
    // Chocolate NO debe solaparse consigo mismo: cada mordida reinicia el sonido anterior.
    const audio = this.chocolateBiteSoundPreload;
    if (!audio) {
      return;
    }

    if (this.chocolateBiteStopTimeoutId !== null) {
      window.clearTimeout(this.chocolateBiteStopTimeoutId);
      this.chocolateBiteStopTimeoutId = null;
    }

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // Si el metadata aún no cargó, arrancamos desde donde se pueda.
    }
    void audio.play().catch(() => undefined);

    this.chocolateBiteStopTimeoutId = window.setTimeout(() => {
      audio.pause();
      this.chocolateBiteStopTimeoutId = null;
    }, CHOCOLATE_BITE_SOUND_DURATION_MS);
  }

  private playCoinSound(): void {
    this.playOverlappingSound('assets/mariocoin.mp3');
  }

  private stopChocolateBiteSound(): void {
    if (this.chocolateBiteStopTimeoutId !== null) {
      window.clearTimeout(this.chocolateBiteStopTimeoutId);
      this.chocolateBiteStopTimeoutId = null;
    }
    if (!this.chocolateBiteSoundPreload) {
      return;
    }
    this.chocolateBiteSoundPreload.pause();
    try {
      this.chocolateBiteSoundPreload.currentTime = 0;
    } catch {
      // ignore
    }
  }

  private playOverlappingSound(
    src: string,
    options?: { startSeconds?: number; durationMs?: number }
  ): void {
    if (typeof Audio === 'undefined') {
      return;
    }

    const audio = new Audio(src);
    audio.preload = 'auto';

    if (options?.startSeconds !== undefined) {
      try {
        audio.currentTime = options.startSeconds;
      } catch {
        // Si el metadata aún no cargó, arrancamos desde donde se pueda.
      }
    }

    void audio.play().catch(() => undefined);

    if (options?.durationMs !== undefined) {
      window.setTimeout(() => {
        audio.pause();
      }, options.durationMs);
    }
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
      this.collectIfAny();
    }
  }

  private collectIfAny(): void {
    if (this.mode === 'chocolate') {
      this.collectChocolateIfAny();
      return;
    }

    this.collectCoinIfAny();
    if (this.remainingCoins === 0) {
      this.enterChocolateMode();
    }
  }

  private collectCoinIfAny(): void {
    const cell = this.coins[this.pacRow]?.[this.pacCol];
    if (cell !== 1) {
      return;
    }

    this.coins[this.pacRow][this.pacCol] = 0;
    this.score += 1;
    this.remainingCoins = Math.max(0, this.remainingCoins - 1);
    this.playCoinSound();
  }

  private enterChocolateMode(): void {
    if (this.mode === 'chocolate') {
      return;
    }

    this.mode = 'chocolate';
    this.syncBackgroundMusic();
    this.chocolates = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => 1 as Cell)
    );
    this.remainingChocolates = this.rows * this.cols;
    this.collectChocolateIfAny();
  }

  private collectChocolateIfAny(): void {
    const cell = this.chocolates?.[this.pacRow]?.[this.pacCol];
    if (cell !== 1 || !this.chocolates) {
      return;
    }

    this.chocolates[this.pacRow][this.pacCol] = 0;
    this.score += 1;
    this.remainingChocolates = Math.max(0, this.remainingChocolates - 1);
    this.playChocolateBiteSound();
  }

  private syncBackgroundMusic(): void {
    if (this.mode !== 'chocolate') {
      this.stopBackgroundMusic();
      return;
    }

    const desired: MusicKind = this.extended ? 'baazigar' : 'lavida';
    if (this.activeSong === desired) {
      return;
    }

    this.stopBackgroundMusic();
    this.activeSong = desired;
    if (desired === 'baazigar') {
      this.playBaazigarSong();
    } else {
      this.playLavidaSong();
    }
  }

  private playLavidaSong(): void {
    if (!this.lavidaSong) {
      return;
    }
    this.playMusicFrom(this.lavidaSong, 0);
  }

  private playBaazigarSong(): void {
    if (!this.baazigarSong) {
      return;
    }
    this.playMusicFrom(this.baazigarSong, BAAZIGAR_START_S);
  }

  private playMusicFrom(audio: HTMLAudioElement, startSeconds: number): void {
    const start = () => {
      try {
        audio.currentTime = startSeconds;
      } catch {
        // Si el metadata aún no cargó, arrancamos desde donde se pueda.
      }
      void audio.play().catch(() => undefined);
    };

    audio.pause();
    if (audio.readyState >= 1) {
      start();
      return;
    }

    audio.addEventListener('loadedmetadata', start, { once: true });
    audio.load();
  }

  private stopBackgroundMusic(): void {
    this.activeSong = null;

    if (this.lavidaSong) {
      this.lavidaSong.pause();
      try {
        this.lavidaSong.currentTime = 0;
      } catch {
        // ignore
      }
    }

    if (this.baazigarSong) {
      this.baazigarSong.pause();
      try {
        this.baazigarSong.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }

  private cloneGrid(grid: readonly (readonly Cell[])[]): Cell[][] {
    return grid.map((row) => [...row]);
  }

  private countOnes(grid: readonly (readonly Cell[])[]): number {
    let count = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell === 1) {
          count += 1;
        }
      }
    }
    return count;
  }
}
