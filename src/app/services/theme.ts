import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'puzzles-theme';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly document = inject(DOCUMENT);
    readonly theme = signal<Theme>(this.readInitialTheme());

    constructor() {
        this.applyTheme(this.theme());
    }

    toggle(): void {
        const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
        this.theme.set(next);
        this.applyTheme(next);
        this.storeTheme(next);
    }

    private readInitialTheme(): Theme {
        const current = this.document.documentElement.getAttribute('data-theme');
        if (current === 'light' || current === 'dark') {
            return current;
        }

        const stored = this.readStoredTheme();
        if (stored) {
            return stored;
        }

        // Missing while prerendering, where there's no viewer to ask.
        if (typeof globalThis.matchMedia !== 'function') {
            return 'light';
        }

        return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    private applyTheme(theme: Theme): void {
        this.document.documentElement.setAttribute('data-theme', theme);
    }

    // localStorage is missing while prerendering and blocked outright in some privacy modes.
    private readStoredTheme(): Theme | null {
        try {
            const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
            return stored === 'light' || stored === 'dark' ? stored : null;
        } catch {
            return null;
        }
    }

    private storeTheme(theme: Theme): void {
        try {
            globalThis.localStorage?.setItem(STORAGE_KEY, theme);
        } catch {
            // ignore: theme preference just will not persist
        }
    }
}
