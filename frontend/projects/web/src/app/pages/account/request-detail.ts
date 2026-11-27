import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  API_BASE_URL,
  type ApiResponse,
  type RequestDetail as Detail,
  type RequestMessage,
} from '@seyyar/shared';
import { errorKey } from '../../core/error-key';
import { LanguageService } from '../../core/language';
import { placeLink } from '../../core/place-routes';
import { AznPipe } from '../../ui/azn.pipe';
import { StatusBadge } from '../../ui/status-badge';
import { ReviewForm } from './review-form';

// /en/account/requests/TRZ-123456
@Component({
  selector: 'app-request-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AznPipe,
    StatusBadge,
    ReviewForm,
  ],
  templateUrl: './request-detail.html',
})
export class RequestDetail {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  protected readonly lang = inject(LanguageService).current;

  // From the URL: /account/requests/:code
  readonly code = input.required<string>();

  protected readonly request = httpResource<ApiResponse<Detail>>(
    () => `${this.api}/requests/${this.code()}?lang=${this.lang()}`,
  );
  protected readonly data = computed(() =>
    this.request.hasValue() ? this.request.value().data : null,
  );
  protected readonly notFound = computed(() => this.request.error() !== undefined);

  protected readonly placeLink = computed(() => {
    const place = this.data()?.place;
    return place ? placeLink(this.lang(), place.type, place.slug) : null;
  });

  // Messages can be sent while the request is still open
  protected readonly canWrite = computed(() => {
    const status = this.data()?.status;
    return status !== undefined && status !== 'CANCELLED' && status !== 'EXPIRED';
  });

  // ── Cancel ──────────────────────────────────
  protected readonly confirmCancel = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected cancel(): void {
    this.cancelling.set(true);
    this.actionError.set(null);

    this.http
      .patch<ApiResponse<Detail>>(
        `${this.api}/requests/${this.code()}/cancel?lang=${this.lang()}`,
        {},
      )
      .subscribe({
        next: ({ data }) => {
          this.request.set({ data });
          this.cancelling.set(false);
          this.confirmCancel.set(false);
        },
        error: (err: unknown) => {
          this.cancelling.set(false);
          this.actionError.set(errorKey(err));
        },
      });
  }

  // ── Messages ────────────────────────────────
  protected readonly messageForm = inject(NonNullableFormBuilder).group({
    text: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  protected readonly sending = signal(false);

  protected sendMessage(): void {
    const text = this.messageForm.controls.text.value.trim();
    if (!text) return;

    this.sending.set(true);
    this.actionError.set(null);

    this.http
      .post<ApiResponse<RequestMessage>>(`${this.api}/requests/${this.code()}/messages`, { text })
      .subscribe({
        next: ({ data: message }) => {
          // Add the new message to the page without loading everything again
          this.request.update((current) =>
            current
              ? { data: { ...current.data, messages: [...current.data.messages, message] } }
              : current,
          );
          this.messageForm.reset();
          this.sending.set(false);
        },
        error: (err: unknown) => {
          this.sending.set(false);
          this.actionError.set(errorKey(err));
        },
      });
  }
}
