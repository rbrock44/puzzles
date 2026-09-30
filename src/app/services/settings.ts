import { Injectable, signal } from "@angular/core";
import { Location } from "@angular/common";
import { CATEGORIES } from "../constants/categories";
import { Category } from "../objects/category";

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    // A signal so views refresh when a popstate (browser/mouse back) changes it outside a template event.
    private selectedTile = signal<string | null>(null);
    tileUrlParam: string = 'tile';
    categories: Category[] = CATEGORIES;

    constructor(
        private location: Location,
    ) {
        this.location.subscribe(() => this.setSelectedTile(this.readTileFromUrl() ?? ""));
    }

    getSelectedTile(): string | null {
        return this.selectedTile();
    }

    setSelectedTile(tile: string = ""): void {
        if (tile == "") {
            this.selectedTile.set(null);
        } else {
            this.selectedTile.set(tile);
        }
    }

    /** Opens a tile as a new history entry so browser/mouse back returns to the home page. */
    openTile(tile: string): void {
        this.setSelectedTile(tile);
        this.location.go(this.buildUrl(), '', { fromHome: true });
    }

    /** Returns home, stepping back through history when the tile was opened from home. */
    goHome(): void {
        const state = this.location.getState() as { fromHome?: boolean } | null;
        if (state?.fromHome) {
            this.location.back();
            return;
        }

        this.setSelectedTile();
        this.resetUrl();
    }

    /**
     * Selects the tile named in the URL on load. A home entry is slotted in underneath a deep
     * link so browser/mouse back lands on the home page instead of leaving the site.
     */
    restoreFromUrl(): void {
        const tile = this.readTileFromUrl();
        if (tile === null || tile === "") {
            return;
        }

        this.resetUrl();
        this.openTile(tile);
    }

    private readTileFromUrl(): string | null {
        const query = this.location.path().split('?')[1] ?? '';
        return new URLSearchParams(query).get(this.tileUrlParam);
    }

    getCategoryName(tileParam: string): string {
        const category = this.categories.find(c => c.tiles.some(t => t.param === tileParam));
        return category?.name ?? '';
    }

    getStorageKey(tileParam: string): string {
        const tile = this.categories.flatMap(c => c.tiles).find(t => t.param === tileParam);
        return tile?.storageKey ?? '';
    }

    resetUrl(): void {
        this.location.replaceState(this.buildUrl());
    }

    private buildUrl(): string {
        const queryParams = new URLSearchParams();

        const selectedTile = this.selectedTile();
        if (selectedTile !== null && selectedTile !== '') {
            queryParams.set(this.tileUrlParam, selectedTile);
        }

        const end = queryParams.toString();
        if (end !== '') {
            return `${location.pathname}?${queryParams.toString()}`;
        } else {
            return location.pathname;
        }
    }
}
