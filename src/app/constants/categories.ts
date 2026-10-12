import { Category } from '../objects/category';
import { Tile } from '../objects/tile';

export const CATEGORIES: Category[] = [
    {
        name: 'Handheld Puzzles',
        tiles: [
            {
                title: "Rack 'em Up",
                description: 'Tilt and shift to sort the balls into solid-colour rows',
                icon: '',
                param: 'rack-em-up',
                alias: 'reu',
                storageKey: 'puzzles-rack-em-up',
                load: () => import('../components/classic-puzzles/rack-em-up/rack-em-up').then(m => m.RackEmUpComponent),
                centered: true,
                className: 'tile-rack-em-up'
            },
            {
                title: 'Top Spin',
                description: 'Just Put the Numbers in Order...',
                icon: '',
                param: 'top-spin',
                alias: 'ts',
                storageKey: 'puzzles-top-spin',
                load: () => import('../components/classic-puzzles/top-spin/top-spin').then(m => m.TopSpinComponent),
                centered: true,
                className: 'tile-top-spin'
            }
        ]
    }
];

export const TILES: Tile[] = CATEGORIES.flatMap(category => category.tiles);

/** Maps an old `?tile=<param|alias>` value to the puzzle's path, or null when it names nothing. */
export function resolveLegacyTile(tile: string | null): string | null {
    if (!tile) {
        return null;
    }

    return TILES.find(t => t.param === tile || t.alias === tile)?.param ?? null;
}
