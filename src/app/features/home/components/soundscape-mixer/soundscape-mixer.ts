import { DecimalPipe } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { SOUNDS } from '../../../../core/data/sounds';
import { AudioService } from '../../../../core/services/audio.service';

@Component({
  selector: 'app-soundscape-mixer',
  imports: [DecimalPipe],
  templateUrl: './soundscape-mixer.html',
  styleUrl: './soundscape-mixer.scss',
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class SoundscapeMixer {
  protected readonly audio = inject(AudioService);

  readonly closed = output<void>();
  protected readonly mixableSounds = SOUNDS.filter((sound) => sound.mixable);

  protected updateVolume(soundId: string, event: Event): void {
    this.audio.setMixVolume(soundId, Number((event.target as HTMLInputElement).value));
  }
}
