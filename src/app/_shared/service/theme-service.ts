import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
// Keep this key and the initial preference rule in sync with public/theme-init.js.
const THEME_KEY = 'clinica-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly media = this.window?.matchMedia('(prefers-color-scheme: dark)');
  private preference: ThemeMode | null = this.readPreference();
  private readonly current = signal<ThemeMode>('light');
  readonly theme = this.current.asReadonly();
  private readonly changes = new BehaviorSubject<ThemeMode>('light');
  readonly themeChanges$ = this.changes.asObservable();

  constructor() {
    this.apply();
    this.media?.addEventListener('change', this.onDeviceChange);
    this.window?.addEventListener('storage', this.onStorageChange);
    inject(DestroyRef).onDestroy(() => {
      this.media?.removeEventListener('change', this.onDeviceChange);
      this.window?.removeEventListener('storage', this.onStorageChange);
      this.changes.complete();
    });
  }

  toggle(): void {
    this.preference = this.theme() === 'dark' ? 'light' : 'dark';
    try {
      this.window?.localStorage.setItem(THEME_KEY, this.preference);
    } catch {
      // Storage can be disabled; retain the user's choice for this session.
    }
    this.apply();
  }

  private readPreference(): ThemeMode | null {
    try {
      const value = this.window?.localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private readonly onDeviceChange = (): void => {
    if (this.preference === null) this.apply();
  };

  private readonly onStorageChange = (event: StorageEvent): void => {
    if (event.key !== THEME_KEY && event.key !== null) return;
    try {
      if (event.storageArea !== this.window?.localStorage) return;
    } catch {
      return;
    }
    this.preference = this.readPreference();
    this.apply();
  };

  private apply(): void {
    const mode = this.preference ?? (this.media?.matches ? 'dark' : 'light');
    this.document.documentElement.setAttribute('data-theme', mode);
    this.document.documentElement.style.colorScheme = mode;
    this.current.set(mode);
    this.changes.next(mode);
  }
}
