import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GameStateService {
    save<T>(key: string, state: T): void {
        localStorage.setItem(key, JSON.stringify(state));
    }

    load<T>(key: string): T | null {
        const raw = localStorage.getItem(key);
        if (raw === null) {
            return null;
        }

        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }
}
