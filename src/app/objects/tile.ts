import { Type } from '@angular/core';

export interface Tile {
  title: string;
  description: string;
  icon: string;
  param: string;
  /** Short name still accepted in old `?tile=` links. */
  alias?: string;
  storageKey: string;
  /** Loads the puzzle component; only called in the browser. */
  load?: () => Promise<Type<unknown>>;
  centered?: boolean;
  className?: string;
}
