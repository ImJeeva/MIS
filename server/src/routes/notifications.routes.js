import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, forbidden } from '../lib/httpError.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unread = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unread });
  })
);

router.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  })
);

router.patch(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) throw notFound('Notification not found');
    if (n.userId !== req.user.id) throw forbidden();
    const updated = await prisma.notification.update({
      where: { id: n.id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  })
);

export default router;
