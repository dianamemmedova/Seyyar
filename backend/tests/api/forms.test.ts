import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { testOutbox } from '../../src/lib/mailer';
import { resetDatabase } from '../helpers/db';
import { createFixtures } from '../helpers/fixtures';

beforeAll(async () => {
  await resetDatabase();
  await createFixtures();
});

describe('POST /api/contact', () => {
  beforeEach(async () => {
    await prisma.contactMessage.deleteMany();
  });

  const message = {
    name: 'Diana',
    email: 'Diana@Seyyar.test',
    message: 'Do you have tours to Gabala?',
  };

  it('saves the message and emails the admin', async () => {
    const res = await request(app).post('/api/contact').send(message);

    expect(res.status).toBe(201);
    const saved = await prisma.contactMessage.findFirstOrThrow();
    expect(saved).toMatchObject({ email: 'diana@seyyar.test', handledAt: null });
    expect(testOutbox).toEqual([
      expect.objectContaining({
        to: 'admin@seyyar.test',
        subject: expect.stringContaining('Əlaqə formu'),
      }),
    ]);
  });

  it('pretends to accept spam bots but saves nothing', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...message, website: 'http://spam.example' });

    expect(res.status).toBe(201);
    expect(await prisma.contactMessage.count()).toBe(0);
    expect(testOutbox).toHaveLength(0);
  });

  it('validates the message', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...message, message: 'Hi' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/subscribe', () => {
  it('subscribes once, even when sent twice', async () => {
    await request(app).post('/api/subscribe').send({ email: 'fan@seyyar.test' });
    const again = await request(app)
      .post('/api/subscribe')
      .send({ email: 'FAN@seyyar.test', interest: 'NEWS' });

    expect(again.status).toBe(201);
    const subscribers = await prisma.subscriber.findMany();
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0]).toMatchObject({ email: 'fan@seyyar.test', interest: 'NEWS' });
  });
});

describe('POST /api/partners/apply', () => {
  beforeEach(async () => {
    await prisma.partnerApplication.deleteMany();
  });

  const application = {
    businessType: 'GUEST_HOUSE',
    businessName: 'Sheki Garden House',
    voen: '1234567890',
    address: 'Sheki, M.F. Akhundov 12',
    contactName: 'Rashad',
    phone: '+994501112233',
    email: 'rashad@seyyar.test',
  };

  it('saves the application and emails the business and the admin', async () => {
    const res = await request(app).post('/api/partners/apply').send(application);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ status: 'NEW' });
    expect(testOutbox.map((mail) => mail.to).sort()).toEqual([
      'admin@seyyar.test',
      'rashad@seyyar.test',
    ]);
    expect(testOutbox.find((mail) => mail.to === 'admin@seyyar.test')!.text).toContain('Qonaq evi');
  });

  it('allows only one open application per VOEN', async () => {
    await request(app).post('/api/partners/apply').send(application);
    const res = await request(app).post('/api/partners/apply').send(application);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APPLICATION_EXISTS');
  });

  it('allows applying again after a rejection', async () => {
    await request(app).post('/api/partners/apply').send(application);
    await prisma.partnerApplication.updateMany({ data: { status: 'REJECTED' } });

    const res = await request(app).post('/api/partners/apply').send(application);
    expect(res.status).toBe(201);
  });

  it('ignores spam bots', async () => {
    const res = await request(app)
      .post('/api/partners/apply')
      .send({ ...application, website: 'spam' });

    expect(res.status).toBe(201);
    expect(await prisma.partnerApplication.count()).toBe(0);
  });
});

describe('GET /api/faq', () => {
  it('returns active questions grouped by category, in order', async () => {
    const res = await request(app).get('/api/faq');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      {
        category: 'money',
        items: [
          expect.objectContaining({ question: 'Cards?' }),
          expect.objectContaining({ question: 'Currency?' }),
        ],
      },
      { category: 'sim', items: [expect.objectContaining({ question: 'SIM card?' })] },
    ]);
  });

  it('filters by category and translates', async () => {
    const res = await request(app).get('/api/faq?category=SIM&lang=ru');
    expect(res.body.data).toEqual([
      { category: 'sim', items: [expect.objectContaining({ question: 'SIM card? (ru)' })] },
    ]);
  });
});
