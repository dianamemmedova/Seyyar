import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlaceFilterOptions, PlaceType } from '@seyyar/shared';
import { type PlaceFilters, toggle } from '../../core/place-filters';

// Left column of a list page. It only reports what changed; the page puts it into the URL.
@Component({
  selector: 'app-filters-panel',
  imports: [TranslatePipe],
  templateUrl: './filters-panel.html',
})
export class FiltersPanel {
  readonly type = input.required<PlaceType>();
  readonly filters = input.required<PlaceFilters>();
  readonly options = input.required<PlaceFilterOptions | null>();
  readonly activeCount = input(0);

  readonly changed = output<Partial<PlaceFilters>>();
  readonly cleared = output<void>();

  protected readonly toggle = toggle;
  protected readonly priceSymbols = (level: number) => '₼'.repeat(level);

  protected setPrice(key: 'priceMin' | 'priceMax', value: string): void {
    const n = Number(value);
    this.changed.emit({
      [key]: value.trim() === '' || !Number.isFinite(n) ? null : n,
    });
  }

  protected search(value: string): void {
    this.changed.emit({ q: value.trim() });
  }
}
