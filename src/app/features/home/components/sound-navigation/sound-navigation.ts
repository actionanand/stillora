import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Sound } from '../../../../core/models/app.models';

@Component({
  selector: 'app-sound-navigation',
  imports: [NgOptimizedImage],
  templateUrl: './sound-navigation.html',
  styleUrl: './sound-navigation.scss',
})
export class SoundNavigation {
  readonly sounds = input.required<readonly Sound[]>();
  readonly currentSoundId = input.required<string>();
  readonly selected = output<Sound>();
  readonly closed = output<void>();
}
