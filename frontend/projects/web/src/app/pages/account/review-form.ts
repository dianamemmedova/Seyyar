import { Component, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { API_BASE_URL } from '@seyyar/shared';
import { errorKey } from '../../core/error-key';

const TRAVEL_TYPES = ['family', 'couple', 'solo', 'friends'] as const;

// "How was your visit?" — shown only when the request is ARRIVED and not reviewed yet
@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="flex flex-col gap-gutter-md rounded-lg border border-sage bg-sage-soft p-gutter-lg">
      @if (sent()) {
        <p class="flex items-center gap-2 text-label-lg text-success" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          {{ 'review.thanks' | translate }}
        </p>
      } @else {
        <h2 class="text-title-md">{{ 'review.title' | translate }}</h2>

        @if (error(); as message) {
          <p class="text-body-md text-error" role="alert">{{ message | translate }}</p>
        }

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="flex flex-col gap-gutter-md"
          novalidate
        >
          <fieldset class="flex flex-col gap-gutter-xs">
            <legend class="text-label-lg">{{ 'review.rating' | translate }}</legend>
            <div class="flex gap-1">
              @for (star of stars; track star) {
                <button
                  type="button"
                  (click)="form.controls.rating.setValue(star)"
                  [attr.aria-label]="star + ' / 5'"
                  [attr.aria-pressed]="form.controls.rating.value === star"
                  class="text-secondary"
                >
                  <span
                    class="material-symbols-outlined text-[32px]"
                    [class.filled]="star <= form.controls.rating.value"
                    aria-hidden="true"
                    >star</span
                  >
                </button>
              }
            </div>
            @if (form.controls.rating.touched && form.controls.rating.invalid) {
              <span class="text-body-sm text-error">{{ 'review.ratingRequired' | translate }}</span>
            }
          </fieldset>

          <label class="field">
            <span class="text-label-lg">{{ 'review.travelType' | translate }}</span>
            <select formControlName="travelType" class="input">
              <option value="">—</option>
              @for (type of travelTypes; track type) {
                <option [value]="type">{{ 'review.types.' + type | translate }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span class="text-label-lg">{{ 'review.text' | translate }}</span>
            <textarea formControlName="text" rows="4" class="input"></textarea>
            @if (form.controls.text.touched && form.controls.text.invalid) {
              <span class="text-body-sm text-error">{{ 'review.textError' | translate }}</span>
            }
          </label>

          <button type="submit" [disabled]="sending()" class="btn-primary self-start">
            {{ 'review.send' | translate }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ReviewForm {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  readonly requestCode = input.required<string>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly travelTypes = TRAVEL_TYPES;

  protected readonly form = inject(NonNullableFormBuilder).group({
    rating: [0, Validators.min(1)],
    travelType: [''],
    // Optional, but if written then at least 10 characters (same as the API)
    text: ['', [Validators.minLength(10), Validators.maxLength(2000)]],
  });

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { rating, travelType, text } = this.form.getRawValue();
    const body = {
      requestCode: this.requestCode(),
      rating,
      ...(travelType ? { travelType } : {}),
      ...(text.trim() ? { text: text.trim() } : {}),
    };

    this.sending.set(true);
    this.error.set(null);
    this.http.post(`${this.api}/reviews`, body).subscribe({
      next: () => this.sent.set(true),
      error: (err: unknown) => {
        this.sending.set(false);
        this.error.set(errorKey(err));
      },
    });
  }
}
