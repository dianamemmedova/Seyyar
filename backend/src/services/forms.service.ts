import { config } from '../config';
import { prisma } from '../lib/prisma';
import { localize } from '../lib/i18n';
import { ConflictError } from '../lib/errors';
import { sendMailInBackground, type Mail } from '../lib/mailer';
import {
  contactMessageForAdmin,
  partnerApplicationForAdmin,
  partnerApplicationReceived,
} from '../emails/templates';
import type {
  ContactInput,
  FaqQuery,
  PartnerApplicationInput,
  SubscribeInput,
} from '../schemas/forms.schema';

// Admin emails go out only when ADMIN_NOTIFY_EMAIL is set in .env
function notifyAdmin(buildMail: (to: string) => Mail): void {
  if (config.ADMIN_NOTIFY_EMAIL) {
    sendMailInBackground(buildMail(config.ADMIN_NOTIFY_EMAIL));
  }
}

// ─────────────────────────────────────────────
// Contact form
// ─────────────────────────────────────────────

export async function sendContactMessage(input: ContactInput): Promise<void> {
  // A bot filled the hidden field: answer "ok" but save nothing
  if (input.website) return;

  const saved = await prisma.contactMessage.create({
    data: { name: input.name, email: input.email, message: input.message },
  });

  notifyAdmin((to) => contactMessageForAdmin(to, saved));
}

// ─────────────────────────────────────────────
// Newsletter / "notify me when regions launch"
// ─────────────────────────────────────────────

// Subscribing twice is fine, and the answer never tells whether an email was already on the list
export async function subscribe(input: SubscribeInput): Promise<void> {
  await prisma.subscriber.upsert({
    where: { email: input.email },
    create: { email: input.email, interest: input.interest },
    update: { interest: input.interest },
  });
}

// ─────────────────────────────────────────────
// "Become a partner" application
// ─────────────────────────────────────────────

export async function applyAsPartner(input: PartnerApplicationInput) {
  if (input.website) {
    return { status: 'NEW' as const };
  }

  // One open application per business (VOEN) at a time
  const open = await prisma.partnerApplication.findFirst({
    where: { voen: input.voen, status: 'NEW' },
    select: { id: true },
  });

  if (open) {
    throw new ConflictError(
      'An application for this business is already being reviewed',
      'APPLICATION_EXISTS',
    );
  }

  const application = await prisma.partnerApplication.create({
    data: {
      businessType: input.businessType,
      businessName: input.businessName,
      voen: input.voen,
      address: input.address,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
    },
  });

  sendMailInBackground(partnerApplicationReceived(application));
  notifyAdmin((to) => partnerApplicationForAdmin(to, application));

  return { status: application.status };
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

// Grouped for the FAQ page: [{ category: "money", items: [...] }, ...]
export async function listFaq(query: FaqQuery) {
  const rows = await prisma.faqItem.findMany({
    where: { isActive: true, category: query.category },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  });

  const groups = new Map<string, { id: number; question: string; answer: string }[]>();

  for (const row of rows) {
    const items = groups.get(row.category) ?? [];
    items.push({
      id: row.id,
      question: localize(row.question, query.lang),
      answer: localize(row.answer, query.lang),
    });
    groups.set(row.category, items);
  }

  return [...groups].map(([category, items]) => ({ category, items }));
}
