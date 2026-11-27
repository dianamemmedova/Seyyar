import { config } from '../config';
import type { Mail } from '../lib/mailer';

type RequestSummary = {
  code: string;
  type: 'HOTEL' | 'TABLE';
  placeName: string;
  dateFrom: string;
  dateTo: string | null;
  time: string | null;
  guests: number;
  children: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: boolean;
  note: string | null;
  totalEstimate: number | null;
};

const when = (request: RequestSummary) =>
  request.type === 'HOTEL'
    ? `${request.dateFrom} → ${request.dateTo}`
    : `${request.dateFrom}, ${request.time}`;

const money = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)} AZN`);

// To the hotel / restaurant (local businesses, so in Azerbaijani)
export function newRequestForPlace(to: string, request: RequestSummary): Mail {
  const kind = request.type === 'HOTEL' ? 'Yeni rezerv sorğusu' : 'Yeni masa sorğusu';
  const replyWithin = request.type === 'HOTEL' ? '2 saat' : '1 saat';

  const lines = [
    `${kind}: ${request.code}`,
    '',
    `Obyekt: ${request.placeName}`,
    `Tarix: ${when(request)}`,
    `Qonaqlar: ${request.guests} böyük, ${request.children} uşaq`,
    `Təxmini məbləğ: ${money(request.totalEstimate)}`,
    '',
    `Əlaqə: ${request.contactName}`,
    `Telefon: ${request.contactPhone}${request.contactWhatsapp ? ' (WhatsApp)' : ''}`,
    `E-poçt: ${request.contactEmail}`,
  ];

  if (request.note) {
    lines.push(`Qeyd: ${request.note}`);
  }

  lines.push('', `Zəhmət olmasa ${replyWithin} ərzində qonaqla əlaqə saxlayıb təsdiq edin.`);

  return { to, subject: `${kind} ${request.code} — ${request.placeName}`, text: lines.join('\n') };
}

// To the tourist (English)
export function requestReceivedForTourist(request: RequestSummary): Mail {
  return {
    to: request.contactEmail,
    subject: `Your request ${request.code} has been sent — ${request.placeName}`,
    text: [
      `Hi ${request.contactName},`,
      '',
      `Your request ${request.code} to ${request.placeName} has been sent.`,
      `Date: ${when(request)}`,
      `Guests: ${request.guests + request.children}`,
      `Estimated total: ${money(request.totalEstimate)} (you pay at the place)`,
      '',
      `Show the code ${request.code} when you arrive.`,
      `Track your request: ${config.APP_WEB_URL}/account/requests/${request.code}`,
      '',
      'Seyyar',
    ].join('\n'),
  };
}

export function requestCancelledForPlace(to: string, request: RequestSummary): Mail {
  return {
    to,
    subject: `Sorğu ləğv edildi ${request.code} — ${request.placeName}`,
    text: [
      `Qonaq ${request.code} sorğusunu ləğv etdi.`,
      '',
      `Tarix: ${when(request)}`,
      `Qonaq: ${request.contactName}, ${request.contactPhone}`,
    ].join('\n'),
  };
}

export function passwordResetForUser(to: string, fullName: string, token: string): Mail {
  return {
    to,
    subject: 'Reset your Seyyar password',
    text: [
      `Hi ${fullName},`,
      '',
      'Use this link to set a new password. It works once and expires in 1 hour:',
      `${config.APP_WEB_URL}/auth/reset-password?token=${token}`,
      '',
      'If you did not ask for this, you can ignore this email.',
      '',
      'Seyyar',
    ].join('\n'),
  };
}

export type { RequestSummary };

// ─────────────────────────────────────────────
// Forms
// ─────────────────────────────────────────────

const BUSINESS_TYPES: Record<string, string> = {
  HOTEL: 'Otel',
  RESTAURANT: 'Restoran',
  GUEST_HOUSE: 'Qonaq evi',
  ATTRACTION: 'Görməli yer',
};

export function contactMessageForAdmin(
  to: string,
  message: { id: number; name: string; email: string; message: string },
): Mail {
  return {
    to,
    subject: `Əlaqə formu #${message.id} — ${message.name}`,
    text: [`Ad: ${message.name}`, `E-poçt: ${message.email}`, '', message.message].join('\n'),
  };
}

type ApplicationSummary = {
  id: number;
  businessType: string;
  businessName: string;
  voen: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
};

export function partnerApplicationForAdmin(to: string, application: ApplicationSummary): Mail {
  return {
    to,
    subject: `Yeni tərəfdaş müraciəti #${application.id} — ${application.businessName}`,
    text: [
      `Növ: ${BUSINESS_TYPES[application.businessType] ?? application.businessType}`,
      `Ad: ${application.businessName}`,
      `VÖEN: ${application.voen}`,
      `Ünvan: ${application.address}`,
      '',
      `Əlaqə: ${application.contactName}`,
      `Telefon: ${application.phone}`,
      `E-poçt: ${application.email}`,
      '',
      'Müraciəti admin paneldə yoxlayın.',
    ].join('\n'),
  };
}

// To the business (local, so in Azerbaijani)
export function partnerApplicationReceived(application: ApplicationSummary): Mail {
  return {
    to: application.email,
    subject: `Seyyar: müraciətiniz qəbul edildi — ${application.businessName}`,
    text: [
      `Salam, ${application.contactName}!`,
      '',
      `"${application.businessName}" üçün tərəfdaşlıq müraciətiniz bizə çatdı.`,
      'Komandamız məlumatları yoxlayıb 2 iş günü ərzində sizinlə əlaqə saxlayacaq.',
      '',
      'Seyyar',
    ].join('\n'),
  };
}
