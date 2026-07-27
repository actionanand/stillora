import { Injectable } from '@angular/core';
import { MediaSession } from '@capgo/capacitor-media-session';
import { Sound } from '../models/app.models';

interface MediaControlHandlers {
  readonly play: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
}

interface MediaControlState {
  readonly enabled: boolean;
  readonly active: boolean;
  readonly playing: boolean;
  readonly sound: Sound;
  readonly mixCount: number;
}

@Injectable({ providedIn: 'root' })
export class MediaControlsService {
  private handlers: MediaControlHandlers | null = null;
  private handlersRegistered = false;
  private operation = Promise.resolve();

  initialize(handlers: MediaControlHandlers): void {
    this.handlers = handlers;
  }

  sync(state: MediaControlState): void {
    this.operation = this.operation
      .then(() => this.applyState(state))
      .catch(() => {
        // Browser previews and unsupported native shells must not interrupt audio playback.
      });
  }

  destroy(): void {
    this.operation = this.operation
      .then(async () => {
        await this.unregisterHandlers();
        await MediaSession.setPlaybackState({ playbackState: 'none' });
      })
      .catch(() => {
        // The native bridge may already be unavailable while Angular is being destroyed.
      });
  }

  private async applyState(state: MediaControlState): Promise<void> {
    if (!state.enabled || !state.active) {
      await this.unregisterHandlers();
      await MediaSession.setPlaybackState({ playbackState: 'none' });
      return;
    }

    await this.registerHandlers();
    await MediaSession.setMetadata({
      title: state.sound.title,
      artist: 'Stillora',
      album:
        state.mixCount === 0
          ? 'Ambient atmosphere'
          : `${state.mixCount} additional ${state.mixCount === 1 ? 'layer' : 'layers'}`,
    });
    await MediaSession.setPlaybackState({
      playbackState: state.playing ? 'playing' : 'paused',
    });
  }

  private async registerHandlers(): Promise<void> {
    if (this.handlersRegistered || !this.handlers) return;
    await MediaSession.setActionHandler({ action: 'play' }, () => this.handlers?.play());
    await MediaSession.setActionHandler({ action: 'pause' }, () => this.handlers?.pause());
    await MediaSession.setActionHandler({ action: 'stop' }, () => this.handlers?.stop());
    this.handlersRegistered = true;
  }

  private async unregisterHandlers(): Promise<void> {
    if (!this.handlersRegistered) return;
    await MediaSession.setActionHandler({ action: 'play' }, null);
    await MediaSession.setActionHandler({ action: 'pause' }, null);
    await MediaSession.setActionHandler({ action: 'stop' }, null);
    this.handlersRegistered = false;
  }
}
