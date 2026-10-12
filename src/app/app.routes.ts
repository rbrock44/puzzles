import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { resolveLegacyTile, TILES } from './constants/categories';
import { PageData, SITE_DESCRIPTION, SITE_TITLE } from './constants/site';
import { TileGridComponent } from './components/tile-grid/tile-grid';
import { PuzzlePageComponent } from './components/puzzle-page/puzzle-page';

/** Sends old `/?tile=<param|alias>` links to the puzzle's own page. */
export const redirectLegacyTile: CanActivateFn = route => {
  const param = resolveLegacyTile(route.queryParamMap.get('tile'));
  return param ? inject(Router).createUrlTree(['/', param]) : true;
};

const puzzleRoutes: Routes = TILES.map(tile => ({
  path: tile.param,
  component: PuzzlePageComponent,
  title: `${tile.title} – ${SITE_TITLE}`,
  data: { description: tile.description, tile } satisfies PageData
}));

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: TileGridComponent,
    canActivate: [redirectLegacyTile],
    title: SITE_TITLE,
    data: { description: SITE_DESCRIPTION } satisfies PageData
  },
  ...puzzleRoutes,
  { path: '**', redirectTo: '' }
];
