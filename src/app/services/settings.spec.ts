import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should find the category a tile belongs to', () => {
    expect(service.getCategoryName('rack-em-up')).toBe('Handheld Puzzles');
  });

  it('should find a tile storage key', () => {
    expect(service.getStorageKey('top-spin')).toBe('puzzles-top-spin');
  });

  it('should return empty strings for an unknown tile', () => {
    expect(service.getCategoryName('nope')).toBe('');
    expect(service.getStorageKey('nope')).toBe('');
  });
});
