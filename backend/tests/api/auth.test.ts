import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { testOutbox } from '../../src/lib/mailer';
import { resetDatabase } from '../helpers/db';
import { createUser, TEST_PASSWORD } from '../helpers/users';

const REGISTER = {
  fullName: 'Diana Mammadova',
  email: 'diana@seyyar.test',
  password: 'Password123',
};

// The refresh token cookie ("seyyar_rt=...") from a response
function refreshCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((value) => value.startsWith('seyyar_rt='));
  if (!cookie) throw new Error('No refresh cookie in the response');
  return cookie.split(';')[0];
}

beforeAll(async () => {
  await resetDatabase();
});

describe('POST /api/auth/register', () => {
  beforeEach(resetDatabase);

  it('creates a tourist and logs them in', async () => {
    const res = await request(app).post('/api/auth/register').send(REGISTER);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      email: 'diana@seyyar.test',
      fullName: 'Diana Mammadova',
      role: 'TOURIST',
    });
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    // The password hash must never leave the server
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('sets the refresh token as a safe cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(REGISTER);
    const cookie = ([] as string[]).concat(res.headers['set-cookie'])[0];

    expect(cookie).toMatch(/^seyyar_rt=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('stores only a hash of the password', async () => {
    await request(app).post('/api/auth/register').send(REGISTER);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: REGISTER.email } });

    expect(user.passwordHash).not.toBe(REGISTER.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects an email that is already registered (any letter case)', async () => {
    await request(app).post('/api/auth/register').send(REGISTER);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...REGISTER, email: 'DIANA@seyyar.test' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('lists every invalid field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'D', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(resetDatabase);

  it('logs in with the right password', async () => {
    const { user } = await createUser({ email: 'login@seyyar.test' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@seyyar.test', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await createUser({ email: 'login@seyyar.test' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@seyyar.test', password: 'Wrong12345' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@seyyar.test', password: 'Wrong12345' });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('refuses blocked accounts', async () => {
    await createUser({ email: 'blocked@seyyar.test', isBlocked: true });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'blocked@seyyar.test', password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(resetDatabase);

  it('returns the logged-in user', async () => {
    const { user, auth } = await createUser();
    const res = await request(app).get('/api/auth/me').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
  });

  it('needs a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a fake token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('tells the client when the token has expired', async () => {
    const { user } = await createUser();
    const expired = jwt.sign({ role: 'TOURIST' }, process.env.JWT_SECRET!, {
      subject: String(user.id),
      expiresIn: -10,
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(resetDatabase);

  it('gives a new access token and a new refresh cookie', async () => {
    const registered = await request(app).post('/api/auth/register').send(REGISTER);
    const oldCookie = refreshCookie(registered);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(res)).not.toBe(oldCookie);
  });

  it('accepts each refresh token only once', async () => {
    const registered = await request(app).post('/api/auth/register').send(REGISTER);
    const oldCookie = refreshCookie(registered);

    await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    const second = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);

    expect(second.status).toBe(401);
    expect(second.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('logs the user out everywhere when an old token is reused (probably stolen)', async () => {
    const registered = await request(app).post('/api/auth/register').send(REGISTER);
    const stolen = refreshCookie(registered);

    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', stolen);
    const current = refreshCookie(rotated);

    // The thief uses the old token...
    await request(app).post('/api/auth/refresh').set('Cookie', stolen);

    // ...so the real user's current token stops working too
    const res = await request(app).post('/api/auth/refresh').set('Cookie', current);
    expect(res.status).toBe(401);
  });

  it('needs the cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('REFRESH_TOKEN_MISSING');
  });

  it('rejects an expired refresh token', async () => {
    const registered = await request(app).post('/api/auth/register').send(REGISTER);
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie(registered));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('REFRESH_TOKEN_EXPIRED');
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(resetDatabase);

  it('ends the session and clears the cookie', async () => {
    const registered = await request(app).post('/api/auth/register').send(REGISTER);
    const cookie = refreshCookie(registered);

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(204);
    expect(([] as string[]).concat(res.headers['set-cookie'])[0]).toMatch(/seyyar_rt=;/);

    const refresh = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refresh.status).toBe(401);
  });

  it('works even without a cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('forgot / reset password', () => {
  beforeEach(resetDatabase);

  // The reset token from the link in the last email
  const tokenFromEmail = () => {
    const mail = testOutbox.at(-1)!;
    return /token=([\w-]+)/.exec(mail.text)![1];
  };

  it('answers the same way for unknown emails and sends nothing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@seyyar.test' });

    expect(res.status).toBe(200);
    expect(testOutbox).toHaveLength(0);
  });

  it('emails a reset link to a registered user', async () => {
    await createUser({ email: 'forgot@seyyar.test' });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'forgot@seyyar.test' });

    expect(res.status).toBe(200);
    expect(testOutbox).toHaveLength(1);
    expect(testOutbox[0]).toMatchObject({ to: 'forgot@seyyar.test' });
    expect(testOutbox[0].text).toContain('/auth/reset-password?token=');
  });

  it('sets a new password, works once and logs out every session', async () => {
    await createUser({ email: 'forgot@seyyar.test' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'forgot@seyyar.test', password: TEST_PASSWORD });
    await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@seyyar.test' });
    const token = tokenFromEmail();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassword456' });
    expect(reset.status).toBe(204);

    // New password works, old one does not
    const withNew = await request(app)
      .post('/api/auth/login')
      .send({ email: 'forgot@seyyar.test', password: 'NewPassword456' });
    const withOld = await request(app)
      .post('/api/auth/login')
      .send({ email: 'forgot@seyyar.test', password: TEST_PASSWORD });
    expect(withNew.status).toBe(200);
    expect(withOld.status).toBe(401);

    // The link cannot be used twice
    const again = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'Another789' });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('INVALID_RESET_TOKEN');

    // The session from before the reset is closed
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie(login));
    expect(refresh.status).toBe(401);
  });

  it('rejects an expired link', async () => {
    await createUser({ email: 'forgot@seyyar.test' });
    await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@seyyar.test' });
    await prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromEmail(), password: 'NewPassword456' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });
});
