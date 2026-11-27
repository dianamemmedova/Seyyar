import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type * as Leaflet from 'leaflet';

export type MapPin = {
  id: number;
  lat: number;
  lng: number;
  // Short text on the pin: "120 ₼" or the place name
  label: string;
};

// Baku city centre, used when there are no pins
const BAKU: [number, number] = [40.3777, 49.892];

/**
 * OpenStreetMap with price/name pins (Leaflet).
 * Leaflet needs `window`, so it is loaded only in the browser, after the first render.
 * On the server this is just an empty sand-coloured box.
 */
@Component({
  selector: 'app-place-map',
  host: { class: 'block' },
  template: `<div #map class="h-full w-full overflow-hidden rounded-lg bg-sand"></div>`,
})
export class PlaceMap {
  readonly pins = input.required<MapPin[]>();
  readonly zoom = input(15);
  // A pin was clicked: its id
  readonly pinClick = output<number>();

  private readonly element = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly leaflet = signal<typeof Leaflet | null>(null);
  private map?: Leaflet.Map;
  private layer?: Leaflet.LayerGroup;

  constructor() {
    afterNextRender(async () => {
      const module = await import('leaflet');
      // Leaflet is an old CommonJS package: the bundler may put it under "default"
      const L = (module as unknown as { default?: typeof Leaflet }).default ?? module;
      this.map = L.map(this.element().nativeElement, {
        scrollWheelZoom: false,
      }).setView(BAKU, 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.leaflet.set(L);
    });

    // Draw the pins again whenever the list changes (other page, other filters)
    effect(() => {
      const L = this.leaflet();
      const pins = this.pins();
      if (L) this.draw(L, pins);
    });

    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  private draw(L: typeof Leaflet, pins: MapPin[]): void {
    if (!this.map || !this.layer) return;
    this.layer.clearLayers();

    for (const pin of pins) {
      // Our own HTML pin (styled in styles.css) instead of Leaflet's image marker
      const icon = L.divIcon({
        className: 'map-pin-wrap',
        html: `<span class="map-pin">${escapeHtml(pin.label)}</span>`,
        iconSize: undefined,
      });
      L.marker([pin.lat, pin.lng], { icon, title: pin.label })
        .on('click', () => this.pinClick.emit(pin.id))
        .addTo(this.layer);
    }

    if (pins.length === 1) {
      this.map.setView([pins[0].lat, pins[0].lng], this.zoom());
    } else if (pins.length > 1) {
      this.map.fitBounds(
        L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number])),
        { padding: [40, 40], maxZoom: this.zoom() },
      );
    }
  }
}

// Place names come from the database: never put them into HTML unescaped
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
