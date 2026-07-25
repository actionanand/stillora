import { Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-background-video',
  template: `
    <div class="ambient-backdrop" [class.fallback]="failed()">
      <video
        [src]="path()"
        [class.ready]="ready() && !failed()"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
        (canplay)="ready.set(true)"
        (error)="onError()"
      ></video>
      <div class="veil"></div>
      <div class="glow"></div>
    </div>
  `,
  styleUrl: './background-video.scss',
})
export class BackgroundVideo {
  readonly path = input.required<string>();
  readonly unavailable = output<void>();
  readonly ready = signal(false);
  readonly failed = signal(false);

  constructor() {
    effect(() => {
      this.path();
      this.ready.set(false);
      this.failed.set(false);
    });
  }

  onError(): void {
    this.failed.set(true);
    this.unavailable.emit();
  }
}
