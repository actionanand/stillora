import { DecimalPipe } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { SOUNDS } from '../../../../core/data/sounds';
import { AudioService } from '../../../../core/services/audio.service';
import { SettingsStore } from '../../../../core/stores/settings.store';

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
  protected readonly settings = inject(SettingsStore);

  readonly closed = output<void>();
  protected readonly mixableSounds = SOUNDS.filter((sound) => sound.mixable);
  protected readonly mixName = signal('');
  protected readonly saveMessage = signal('');

  protected updateVolume(soundId: string, event: Event): void {
    this.audio.setMixVolume(soundId, Number((event.target as HTMLInputElement).value));
  }

  protected updateMixName(event: Event): void {
    this.mixName.set((event.target as HTMLInputElement).value);
    this.saveMessage.set('');
  }

  protected saveCurrentMix(): void {
    try {
      const saved = this.settings.saveMix(
        this.mixName(),
        this.audio.currentSound().id,
        this.audio.mixLayers(),
      );
      this.mixName.set('');
      this.saveMessage.set(`Saved “${saved.name}”. Open it anytime from Mixes.`);
    } catch (error) {
      this.saveMessage.set(error instanceof Error ? error.message : 'This mix could not be saved.');
    }
  }
}
