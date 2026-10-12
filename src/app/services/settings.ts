import { Injectable } from "@angular/core";
import { CATEGORIES, TILES } from "../constants/categories";
import { Category } from "../objects/category";

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    categories: Category[] = CATEGORIES;

    getCategoryName(tileParam: string): string {
        const category = this.categories.find(c => c.tiles.some(t => t.param === tileParam));
        return category?.name ?? '';
    }

    getStorageKey(tileParam: string): string {
        return TILES.find(t => t.param === tileParam)?.storageKey ?? '';
    }
}
