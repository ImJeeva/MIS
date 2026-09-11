import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notFound } from '../lib/httpError.js';
import { publicUser } from '../lib/publicUser.js';
import { notify } from '../services/notify.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, byRole, studies, byType, aiByPrediction, pendingDoctors, shares, notes] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        prisma.study.count(),
        prisma.study.groupBy({ by: ['type'], _count: { _all: true } }),
        prisma.aiResult.groupBy({ by: ['prediction'], _count: { _all: true } }),
        prisma.user.count({ where: { role: 'DOCTOR', isVerified: false } }),
        prisma.share.count({ where: { revokedAt: null } }),
        prisma.appointmentNote.count(),
      ]);

    // uploads per day, last 14 days (keyed by local calendar date)
    const ymd = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const recent = await prisma.study.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const days = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      days[ymd(d)] = 0;
    }
    for (const r of recent) {
      const k = ymd(new Date(r.createdAt));
      if (k in days) days[k] += 1;
    }

    res.json({
      totals: { users, studies, shares, notes, pendingDoctors },
      usersByRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
      studiesByType: Object.fromEntries(byType.map((r) => [r.type, r._count._all])),
      aiByPrediction: Object.fromEntries(
        aiByPrediction.map((r) => [r.prediction || 'PENDING', r._count._all])
      ),
      uploadsPerDay: Object.entries(days).map(([date, count]) => ({ date, count })),
    });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { q, role, status } = req.query;
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Number(req.query.pageSize || 20));

    const where = {
      ...(role ? { role: String(role) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(q
        ? { OR: [{ fullName: { contains: String(q) } }, { email: { contains: String(q) } }] }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users: rows.map(publicUser), total, page, pageSize });
  })
);

router.patch(
  '/users/:id',
  body('isVerified').optional().isBoolean(),
  body('status').optional().isIn(['ACTIVE', 'SUSPENDED']),
  validate,
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('User not found');

    const data = {};
    if ('isVerified' in req.body) data.isVerified = !!req.body.isVerified;
    if ('status' in req.body) data.status = req.body.status;

    const user = await prisma.user.update({ where: { id: target.id }, data });

    if (data.isVerified === true && !target.isVerified) {
      await notify(user.id, {
        type: 'DOCTOR_VERIFIED',
        title: 'Your account is verified',
        body: 'Patients can now find and connect with you.',
        linkTo: '/app',
      });
    }
    await audit(req.user.id, 'ADMIN_UPDATED_USER', {
      targetType: 'User',
      targetId: user.id,
      meta: data,
    });

    res.json({ user: publicUser(user) });
  })
);

router.get(
  '/studies',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Number(req.query.pageSize || 20));
    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, fullName: true, email: true } },
          aiResult: true,
        },
      }),
      prisma.study.count(),
    ]);
    res.json({ studies, total, page, pageSize });
  })
);

router.get(
  '/audit',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Number(req.query.pageSize || 50));
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { id: true, fullName: true, role: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ logs, total, page, pageSize });
  })
);

export default router;
