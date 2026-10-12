import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PageData, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../constants/site';

/**
 * Sets the title and every description, social, canonical, and robots tag from the route.
 * Runs during prerendering too, which is what bakes per-puzzle metadata into each static page.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const title = this.buildTitle(snapshot) ?? SITE_TITLE;
    const data = route.data as Partial<PageData>;
    const description = data.description ?? SITE_DESCRIPTION;
    const path = route.url.map(segment => segment.path).join('/');
    // GitHub Pages serves each prerendered page from its folder, so the trailing slash is the real URL.
    const url = path ? `${SITE_URL}/${path}/` : `${SITE_URL}/`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: data.noindex ? 'noindex' : 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  }
}
