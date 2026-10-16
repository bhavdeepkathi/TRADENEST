import { randomUUID } from 'node:crypto';
import express, { Router } from 'express';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { asyncHandler } from '../../middlewares/errorHandler';
import { authMiddleware } from '../../middlewares/auth';
import { getProductImage, storeProductImage } from '../../utils/objectStorage';

const router = Router();
const imageTypes = {
  'image/jpeg': { extension: 'jpg', signature: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  'image/png': { extension: 'png', signature: (data: Buffer) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { extension: 'webp', signature: (data: Buffer) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' },
  'image/gif': { extension: 'gif', signature: (data: Buffer) => data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6)) },
} as const;

function isImageContentType(value: string): value is keyof typeof imageTypes {
  return Object.hasOwn(imageTypes, value);
}

router.post(
  '/',
  authMiddleware,
  express.raw({ type: Object.keys(imageTypes), limit: '5mb' }),
  asyncHandler(async (req, res) => {
    const headerContentType = req.headers['content-type']?.split(';')[0].toLowerCase();
    if (!headerContentType || !isImageContentType(headerContentType)) {
      throw new ValidationError('Upload a valid JPEG, PNG, WebP, or GIF image');
    }
    const contentType = headerContentType;
    const imageType = imageTypes[contentType];
    const image = Buffer.isBuffer(req.body) ? req.body : undefined;

    if (!image || image.length === 0 || !imageType.signature(image)) {
      throw new ValidationError('Upload a valid JPEG, PNG, WebP, or GIF image');
    }

    const filename = `${randomUUID()}.${imageType.extension}`;
    await storeProductImage(filename, image, contentType);
    res.status(201).json({ url: `/api/products/images/${filename}` });
  })
);

router.get(
  '/:filename',
  asyncHandler(async (req, res, next) => {
    const filename = req.params.filename;
    const extension = filename.match(/\.([a-z]+)$/i)?.[1]?.toLowerCase();
    const contentType = extension
      ? Object.entries(imageTypes).find(([, value]) => value.extension === extension)?.[0]
      : undefined;
    if (!contentType || !/^[0-9a-f-]+\.(jpg|png|webp|gif)$/i.test(filename)) {
      throw new NotFoundError('Product image');
    }

    const image = await getProductImage(filename);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    image.on('error', (error) => {
      if (res.headersSent) res.destroy(error);
      else next(error);
    });
    image.pipe(res);
  })
);

export { router as productImagesRouter };
