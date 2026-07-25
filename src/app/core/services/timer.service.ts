import { computed, Injectable, signal } from '@angular/core';
import { TimerDuration } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private interval: ReturnType<typeof setInterval> | null = null;
  private completion: (() => void) | null = null;

  readonly duration = signal<TimerDuration>(5);
  readonly remainingSeconds = signal<number | null>(5 * 60);
  readonly running = signal(false);
  readonly label = computed(() => {
    if (this.duration() === 'continuous') return 'Continuous';
    const remaining = this.remainingSeconds() ?? 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  select(duration: TimerDuration): void {
    this.stop();
    this.duration.set(duration);
    this.remainingSeconds.set(duration === 'continuous' ? null : duration * 60);
  }

  start(completion: () => void): void {
    this.stopInterval();
    this.completion = completion;
    this.running.set(true);
    const duration = this.duration();
    if (duration === 'continuous') return;
    if ((this.remainingSeconds() ?? 0) <= 0) {
      this.remainingSeconds.set(duration * 60);
    }
    this.interval = setInterval(() => this.tick(), 1000);
  }

  pause(): void {
    this.stopInterval();
    this.running.set(false);
  }

  stop(): void {
    this.pause();
    const duration = this.duration();
    this.remainingSeconds.set(duration === 'continuous' ? null : duration * 60);
  }

  private tick(): void {
    const remaining = this.remainingSeconds();
    if (remaining === null) return;
    if (remaining > 1) {
      this.remainingSeconds.set(remaining - 1);
      return;
    }
    this.remainingSeconds.set(0);
    this.pause();
    this.completion?.();
  }

  private stopInterval(): void {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }
}
