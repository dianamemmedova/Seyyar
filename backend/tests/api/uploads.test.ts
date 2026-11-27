import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import request from 'supertest';
import sharp from 'sharp';
import app from '../../src/app';
import { uploadRoot } from '../../src/lib/images';
import { resetDatabase } from '../helpers/db';
import { createUser } from '../helpers/users';

let tourist: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let jpg: Buffer;

beforeAll(async () => {
  await resetDatabase();
  tourist = await createUser();
  admin = await createUser({ role: 'ADMIN' });
  jpg = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#a0522d' } })
    .jpeg()
    .toBuffer();
});

afterAll(() => {
  // Windows can keep a file locked for a moment, so retry a few times
  rmSync(uploadRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

const upload = (path: string, auth: Record<string, string>) => request(app).post(path).set(auth);

describe('POST /api/uploads/reviews', () => {
  it('saves the images and returns their URLs', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth)
      .attach('photos', jpg, 'one.jpg')
      .attach('photos', jpg, 'two.jpg');

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ width: 400, height: 300 });
  });

  it('serves the saved image as WebP', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth).attach('photos', jpg, 'a.jpg');
    const path = new URL(res.body.data[0].url).pathname;

    const image = await request(app).get(path);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/webp');
    expect(image.headers['cache-control']).toContain('immutable');
  });

  it('needs at least one file', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth).field('note', 'nothing');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILES');
  });

  it('accepts only JPG, PNG and WebP', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth).attach(
      'photos',
      Buffer.from('%PDF-1.4'),
      {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      },
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('detects a fake image with an image name', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth).attach(
      'photos',
      Buffer.from('not really'),
      {
        filename: 'fake.jpg',
        contentType: 'image/jpeg',
      },
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  it('refuses files bigger than 5 MB', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await upload('/api/uploads/reviews', tourist.auth).attach('photos', big, {
      filename: 'big.jpg',
      contentType: 'image/jpeg',
    });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('refuses more than 5 files', async () => {
    let req = upload('/api/uploads/reviews', tourist.auth);
    for (let i = 0; i < 6; i++) req = req.attach('photos', jpg, `${i}.jpg`);

    const res = await req;
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOO_MANY_FILES');
  });

  it('expects the field name "photos"', async () => {
    const res = await upload('/api/uploads/reviews', tourist.auth).attach('photo', jpg, 'a.jpg');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNEXPECTED_FILE_FIELD');
  });

  it('needs a logged-in user', async () => {
    const res = await request(app).post('/api/uploads/reviews').attach('photos', jpg, 'a.jpg');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/uploads/places', () => {
  it('is only for admins and partners', async () => {
    const asTourist = await upload('/api/uploads/places', tourist.auth).attach(
      'photos',
      jpg,
      'a.jpg',
    );
    const asAdmin = await upload('/api/uploads/places', admin.auth).attach('photos', jpg, 'a.jpg');

    expect(asTourist.status).toBe(403);
    expect(asAdmin.status).toBe(201);
    expect(asAdmin.body.data[0].url).toContain('/uploads/places/');
  });
});
