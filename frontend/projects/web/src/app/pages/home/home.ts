import { Component, computed, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { API_BASE_URL, type ApiResponse, type HomeData } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { NewsletterForm } from './newsletter-form';
import { PlaceSection } from './place-section';

const CATEGORIES = [
  { path: 'hotels', icon: 'hotel', key: 'stay', color: 'bg-sage-soft text-primary' },
  {
    path: 'restaurants',
    icon: 'restaurant',
    key: 'eat',
    color: 'bg-terracotta-soft text-on-terracotta',
  },
  {
    path: 'places',
    icon: 'museum',
    key: 'explore',
    color: 'bg-secondary-container text-on-secondary-container',
  },
  { path: 'transport', icon: 'commute', key: 'gettingAround', color: 'bg-sand text-on-sand' },
] as const;

const STEPS = [
  { icon: 'compare_arrows', key: 'compare' },
  { icon: 'send', key: 'request' },
  { icon: 'chat', key: 'confirm' },
] as const;

// What the hero search box can look for, and where the results live
const SEARCH_TYPES = [
  { value: 'hotels', label: 'nav.stay' },
  { value: 'restaurants', label: 'nav.eat' },
  { value: 'places', label: 'nav.explore' },
] as const;

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, TranslatePipe, PlaceSection, NewsletterForm],
  templateUrl: './home.html',
})
export class Home {
  private readonly api = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  protected readonly lang = inject(LanguageService).current;

  protected readonly categories = CATEGORIES;
  protected readonly steps = STEPS;
  protected readonly searchTypes = SEARCH_TYPES;

  // Loads /api/home again whenever the language changes.
  // On the server the answer is put into the page, so the browser does not ask a second time.
  protected readonly home = httpResource<ApiResponse<HomeData>>(
    () => `${this.api}/home?lang=${this.lang()}`,
  );
  protected readonly data = computed(() => (this.home.hasValue() ? this.home.value().data : null));

  protected searchText = '';
  protected searchType: (typeof SEARCH_TYPES)[number]['value'] = 'hotels';

  constructor() {
    // Browser tab title and Google description in the current language
    effect(() => {
      this.lang();
      this.title.setTitle(this.translate.instant('home.meta.title'));
      this.meta.updateTag({
        name: 'description',
        content: this.translate.instant('home.meta.description'),
      });
    });
  }

  protected search(): void {
    const q = this.searchText.trim();
    this.router.navigate(['/', this.lang(), this.searchType], {
      queryParams: q.length >= 2 ? { q } : {},
    });
  }
}
