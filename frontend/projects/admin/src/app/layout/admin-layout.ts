import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@seyyar/shared';

// Frame of every admin page: top bar with the admin's name and "Çıxış". The side menu comes in Phase 3.
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header
      class="flex items-center justify-between bg-surface-card px-page-margin py-gutter-md shadow-card"
    >
      <a routerLink="/" class="text-title-md text-primary">Seyyar Admin</a>
      <div class="flex items-center gap-gutter-md">
        <span class="text-body-md text-on-surface-variant">{{ auth.user()?.fullName }}</span>
        <button
          type="button"
          (click)="logout()"
          class="rounded-md border border-outline px-4 py-2 text-label-lg"
        >
          Çıxış
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-[1200px] px-page-margin py-gutter-xl">
      <router-outlet />
    </main>
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
