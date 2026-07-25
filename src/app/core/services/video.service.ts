import { Injectable, signal } from '@angular/core';
import { Sound } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class VideoService {
  readonly path = signal('video/rain.mp4');
  readonly available = signal(true);

  select(sound: Sound): void {
    this.available.set(true);
    this.path.set(sound.videoPath);
  }

  markUnavailable(): void {
    this.available.set(false);
  }
}
