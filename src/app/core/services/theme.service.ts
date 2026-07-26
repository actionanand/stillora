import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { ThemePreference } from '../models/app.models';
import { SettingsStore } from '../stores/settings.store';

interface SystemBarsBridge {
  setDarkMode(enabled: boolean): void;
}

interface NativeWindow extends Window {
  StilloraSystemBars?: SystemBarsBridge;
  StilloraNative?: { hideSplash(): void };
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsStore);
  private readonly media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  readonly effectiveTheme = signal<'light' | 'dark'>('light');

  constructor() {
    this.media?.addEventListener('change', () => this.apply(this.settings.theme()));
    effect(() => this.apply(this.settings.theme()));
  }

  setPreference(preference: ThemePreference): void {
    this.settings.updateTheme(preference);
  }

  hideNativeSplash(): void {
    const nativeWindow = this.document.defaultView as NativeWindow | null;
    nativeWindow?.StilloraNative?.hideSplash();
  }

  private apply(preference: ThemePreference): void {
    const dark = preference === 'dark' || (preference === 'system' && Boolean(this.media?.matches));
    this.effectiveTheme.set(dark ? 'dark' : 'light');

    const root = this.document.documentElement;
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.dataset['theme'] = preference;

    const color = dark ? '#07140e' : '#f2f7f3';
    root.style.backgroundColor = color;
    this.document.body.style.backgroundColor = color;
    this.document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', color);

    const nativeWindow = this.document.defaultView as NativeWindow | null;
    nativeWindow?.StilloraSystemBars?.setDarkMode(dark);
  }
}
