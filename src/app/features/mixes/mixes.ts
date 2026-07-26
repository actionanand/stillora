import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SOUNDS } from '../../core/data/sounds';
import { SavedMix } from '../../core/models/app.models';
import { AudioService } from '../../core/services/audio.service';
import { VideoService } from '../../core/services/video.service';
import { SettingsStore } from '../../core/stores/settings.store';

@Component({
  selector: 'app-mixes',
  imports: [RouterLink],
  templateUrl: './mixes.html',
  styleUrl: './mixes.scss',
})
export class Mixes {
  protected readonly settings = inject(SettingsStore);
  private readonly audio = inject(AudioService);
  private readonly video = inject(VideoService);
  private readonly router = inject(Router);
  protected readonly message = signal('');

  protected async playMix(mix: SavedMix): Promise<void> {
    const primary = SOUNDS.find((sound) => sound.id === mix.primarySoundId);
    if (!primary) {
      this.message.set(`“${mix.name}” uses an atmosphere that is no longer available.`);
      return;
    }

    this.video.select(primary);
    await this.audio.select(primary);
    await this.audio.replaceMix(mix.layers);
    await this.router.navigate(['/']);
  }

  protected deleteMix(mix: SavedMix): void {
    this.settings.deleteSavedMix(mix.id);
    this.message.set(`Deleted “${mix.name}”.`);
  }

  protected primaryTitle(mix: SavedMix): string {
    return (
      SOUNDS.find((sound) => sound.id === mix.primarySoundId)?.title ?? 'Unavailable atmosphere'
    );
  }

  protected layerTitles(mix: SavedMix): string {
    return mix.layers
      .map((layer) => {
        const sound = SOUNDS.find((candidate) => candidate.id === layer.soundId);
        if (!sound) return null;
        return sound.mixVariant
          ? `${sound.mixTitle ?? sound.title} ${sound.mixVariant}`
          : (sound.mixTitle ?? sound.title);
      })
      .filter((title): title is string => title !== null)
      .join(' · ');
  }
}
