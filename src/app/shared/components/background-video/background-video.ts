import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-background-video',
  template: `
    <div class="ambient-backdrop" [class.fallback]="failed()">
      <video
        #ambientVideo
        [src]="path()"
        [class.ready]="ready() && !failed()"
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
        (canplay)="onCanPlay()"
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
  readonly playing = input.required<boolean>();
  readonly unavailable = output<void>();
  readonly ready = signal(false);
  readonly failed = signal(false);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('ambientVideo');

  constructor() {
    effect(() => {
      this.path();
      this.ready.set(false);
      this.failed.set(false);
    });
    effect(() => {
      const video = this.video()?.nativeElement;
      if (!video) return;
      if (this.playing()) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }

  onCanPlay(): void {
    this.ready.set(true);
    const video = this.video()?.nativeElement;
    if (video && this.playing()) void video.play().catch(() => undefined);
  }

  onError(): void {
    this.failed.set(true);
    this.unavailable.emit();
  }
}
