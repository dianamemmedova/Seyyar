import { afterAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { isUploadedImageUrl, saveImage, uploadRoot } from '../../src/lib/images';

afterAll(() => {
  // Windows can keep a file locked for a moment, so retry a few times
  rmSync(uploadRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe('saveImage', () => {
  it('shrinks a big image to 1600px and saves it as WebP', async () => {
    const png = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: '#5a8a5a' },
    })
      .png()
      .toBuffer();

    const saved = await saveImage(png, 'reviews');

    expect(saved.width).toBe(1600);
    expect(saved.height).toBe(1067); // same 3:2 shape
    expect(saved.url).toMatch(/^http:\/\/localhost:5050\/uploads\/reviews\/[0-9a-f-]{36}\.webp$/);

    const file = path.join(uploadRoot, 'reviews', path.basename(saved.url));
    expect(existsSync(file)).toBe(true);
    // Read into memory first: sharp(path) keeps the file open, and Windows then cannot delete it
    expect((await sharp(readFileSync(file)).metadata()).format).toBe('webp');
  });

  it('does not enlarge small images', async () => {
    const small = await sharp({
      create: { width: 200, height: 100, channels: 3, background: '#fff' },
    })
      .jpeg()
      .toBuffer();
    expect(await saveImage(small, 'places')).toMatchObject({ width: 200, height: 100 });
  });

  it('rejects files that are not real images', async () => {
    await expect(saveImage(Buffer.from('this is not an image'), 'reviews')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_IMAGE',
    });
  });
});

describe('isUploadedImageUrl', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts our own URL in the right folder', () => {
    expect(isUploadedImageUrl(`http://localhost:5050/uploads/reviews/${id}.webp`, 'reviews')).toBe(
      true,
    );
  });

  it.each([
    [`http://localhost:5050/uploads/places/${id}.webp`, 'another folder'],
    [`https://evil.com/uploads/reviews/${id}.webp`, 'another website'],
    [`http://localhost:5050/uploads/reviews/${id}.jpg`, 'not WebP'],
    ['http://localhost:5050/uploads/reviews/../../.env', 'path trick'],
  ])('rejects %s (%s)', (url) => {
    expect(isUploadedImageUrl(url, 'reviews')).toBe(false);
  });
});
