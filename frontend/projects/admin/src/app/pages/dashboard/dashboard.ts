import { Component, inject } from '@angular/core';
import { AuthService } from '@seyyar/shared';

// Placeholder: the real dashboard (requests, places, applications) is built in Phase 3
@Component({
  selector: 'app-dashboard',
  template: `
    <h1 class="text-headline-lg">Xoş gəldiniz, {{ auth.user()?.fullName }}</h1>
    <p class="mt-gutter-sm text-body-lg text-on-surface-variant">
      Admin panelin bölmələri 3-cü fazada əlavə olunacaq.
    </p>
  `,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
