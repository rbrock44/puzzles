import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';

import { SettingsService } from './settings';

describe('SettingsService', () => {
  let service: SettingsService;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocationMocks()]
    });
    service = TestBed.inject(SettingsService);
    location = TestBed.inject(Location);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no selected tile', () => {
    expect(service.getSelectedTile()).toBeNull();
  });

  it('should store the selected tile', () => {
    service.setSelectedTile('rack-em-up');
    expect(service.getSelectedTile()).toBe('rack-em-up');
  });

  it('should treat an empty tile as no selection', () => {
    service.setSelectedTile('rack-em-up');
    service.setSelectedTile('');
    expect(service.getSelectedTile()).toBeNull();
  });

  it('should clear the selection when called with no argument', () => {
    service.setSelectedTile('rack-em-up');
    service.setSelectedTile();
    expect(service.getSelectedTile()).toBeNull();
  });

  it('should push a history entry when opening a tile', () => {
    service.openTile('rack-em-up');
    expect(service.getSelectedTile()).toBe('rack-em-up');
    expect(location.path()).toContain('tile=rack-em-up');
    expect(location.getState()).toEqual({ fromHome: true });
  });

  it('should return home when the browser goes back from an opened tile', () => {
    service.openTile('rack-em-up');
    location.back();
    expect(service.getSelectedTile()).toBeNull();
  });

  it('should go back through history when going home from an opened tile', () => {
    service.openTile('rack-em-up');
    service.goHome();
    expect(service.getSelectedTile()).toBeNull();
    expect(location.path()).not.toContain('tile=');
  });

  it('should restore a deep-linked tile with a home entry underneath', () => {
    location.replaceState('/?tile=top-spin');
    service.restoreFromUrl();
    expect(service.getSelectedTile()).toBe('top-spin');

    location.back();
    expect(service.getSelectedTile()).toBeNull();
  });

  it('should leave the home page alone when the URL has no tile', () => {
    service.restoreFromUrl();
    expect(service.getSelectedTile()).toBeNull();
  });
});
