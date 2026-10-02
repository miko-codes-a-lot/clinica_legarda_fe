import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme-service';

// Pin preference rules rather than CSS or icon implementation.
describe('Theme preference', () => {
  const key = 'clinica-theme';
  const storage = window.localStorage;
  let page: Document;
  let media: MediaQueryList;
  let previous: string | null;
  const mediaEvents = new EventTarget();

  beforeEach(() => {
    previous = localStorage.getItem(key);
    localStorage.removeItem(key);
    page = document.implementation.createHTMLDocument();
    Object.defineProperty(page, 'defaultView', { value: window });
    media = Object.assign(mediaEvents, { matches: true, media: '(prefers-color-scheme: dark)' }) as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(media);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: page }] });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    if (previous === null) storage.removeItem(key);
    else storage.setItem(key, previous);
  });
  function deviceTheme(dark: boolean): void {
    Object.defineProperty(media, 'matches', { value: dark, configurable: true, writable: true });
    mediaEvents.dispatchEvent(new Event('change'));
  }
  function otherTab(value: string | null): void {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value, storageArea: localStorage }));
  }

  it('follows the device until a user chooses a theme', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(page.documentElement.getAttribute('data-theme')).toBe('dark');
    deviceTheme(false);
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(key)).toBeNull();
  });
  it('restores a saved choice ahead of the device preference', () => {
    localStorage.setItem(key, 'light');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    deviceTheme(true);
    expect(service.theme()).toBe('light');
  });
  it('saves a toggle and preserves it when the device changes', () => {
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(key)).toBe('light');
    deviceTheme(false); deviceTheme(true);
    expect(service.theme()).toBe('light');
    service.toggle();
    expect(localStorage.getItem(key)).toBe('dark');
    expect(page.documentElement.style.colorScheme).toBe('dark');
  });
  it('ignores an invalid saved choice and follows the device', () => {
    localStorage.setItem(key, 'invalid');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    deviceTheme(false);
    expect(service.theme()).toBe('light');
  });
  it('can switch when storage is unavailable', () => {
    spyOnProperty(window, 'localStorage', 'get').and.throwError('Storage denied');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(() => service.toggle()).not.toThrow();
    expect(service.theme()).toBe('light');
    deviceTheme(true);
    expect(service.theme()).toBe('light');
  });
  it('synchronizes another tab and returns to device preference when cleared', () => {
    const service = TestBed.inject(ThemeService);
    otherTab('light');
    expect(service.theme()).toBe('light');
    otherTab(null);
    expect(service.theme()).toBe('dark');
    deviceTheme(false);
    expect(service.theme()).toBe('light');
  });
  it('does not change for unrelated storage events', () => {
    const service = TestBed.inject(ThemeService);
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'light', storageArea: localStorage }));
    expect(service.theme()).toBe('dark');
  });
  it('stops listening after application teardown', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.resetTestingModule();
    deviceTheme(false); otherTab('light');
    expect(service.theme()).toBe('dark');
  });
});
