import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

// Frame of every website page: header on top, page in the middle, footer at the bottom
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-site-header />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-site-footer />
    </div>
  `,
})
export class Shell {}
