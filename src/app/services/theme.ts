import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'puzzles-theme';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    readonly theme = signal<Theme>(this.readInitialTheme());

    constructor() {
        this.applyTheme(this.theme());
    }

    toggle(): void {
        const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
        this.theme.set(next);
        this.applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    }

    private readInitialTheme(): Theme {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'light' || current === 'dark') {
            return current;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }

        if (typeof window.matchMedia !== 'function') {
            return 'light';
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    private applyTheme(theme: Theme): void {
        document.documentElement.setAttribute('data-theme', theme);
    }
}
