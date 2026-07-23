import { Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { CATEGORIES } from "../constants/categories";
import { Category } from "../objects/category";

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private selectedTile: string | null = null;
    tileUrlParam: string = 'tile';
    categories: Category[] = CATEGORIES;

    constructor(
        private location: Location,
    ) { }

    getSelectedTile(): string | null {
        return this.selectedTile;
    }

    setSelectedTile(tile: string = ""): void {
        if (tile == "") {
            this.selectedTile = null;
        } else {
            this.selectedTile = tile;
        }
    }

    getCategoryName(tileParam: string): string {
        const category = this.categories.find(c => c.tiles.some(t => t.param === tileParam));
        return category?.name ?? '';
    }

    resetUrl(): void {
        this.location.replaceState(this.buildUrl());
    }

    private buildUrl(): string {
        const queryParams = new URLSearchParams();

        if (this.selectedTile !== null && this.selectedTile !== '') {
            queryParams.set(this.tileUrlParam, this.selectedTile);
        }

        const end = queryParams.toString();
        if (end !== '') {
            return `${location.pathname}?${queryParams.toString()}`;
        } else {
            return location.pathname;
        }
    }
}
