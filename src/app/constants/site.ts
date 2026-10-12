import { Tile } from '../objects/tile';

export const SITE_URL = 'https://puzzles.ryan-brock.com';
export const SITE_TITLE = 'Puzzles';
export const SITE_DESCRIPTION =
  "A tile-based collection of standalone browser puzzles, including Rack 'em Up (sort billiard balls into rows) and Top Spin (order numbers on a ring).";

/** Route `data` read by the SEO title strategy and the puzzle page. */
export interface PageData {
  description: string;
  noindex?: boolean;
  tile?: Tile;
}
