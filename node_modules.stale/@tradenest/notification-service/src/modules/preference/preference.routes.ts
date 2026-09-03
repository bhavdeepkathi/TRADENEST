import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError } from '@tradenest/common';

const router = Router();
function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

// GET /api/preferences - Get notification preferences
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) { prefs = await prisma.notificationPreference.create({ data: { userId } }); }
  res.json(prefs);
}));

// PATCH /api/preferences - Update notification preferences
router.patch('/', validate(z.object({ email: z.boolean().optional(), push: z.boolean().optional(), sms: z.boolean().optional(), marketing: z.boolean().optional() })), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const prefs = await prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...req.body }, update: req.body });
  res.json(prefs);
}));

// POST /api/preferences/device-token - Register device token
router.post('/device-token', validate(z.object({ token: z.string(), platform: z.enum(['ios', 'android', 'web']) })), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  await prisma.deviceToken.upsert({ where: { token: req.body.token }, create: { userId, token: req.body.token, platform: req.body.platform }, update: { userId, active: true } });
  res.json({ success: true });
}));

// DELETE /api/preferences/device-token - Remove device token
router.delete('/device-token/:token', asyncHandler(async (req, res) => {
  await prisma.deviceToken.update({ where: { token: req.params.token }, data: { active: false } });
  res.json({ success: true });
}));

export { router as preferenceRouter };