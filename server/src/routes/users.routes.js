import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../lib/publicUser.js';
import { avatarUpload } from '../middleware/upload.js';

const router = Router();

router.patch(
  '/me',
  requireAuth,
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional({ nullable: true }).trim(),
  body('gender').optional({ nullable: true }).trim(),
  body('dob').optional({ nullable: true }).isISO8601(),
  body('specialization').optional({ nullable: true }).trim(),
  body('licenseNo').optional({ nullable: true }).trim(),
  body('bio').optional({ nullable: true }).trim(),
  validate,
  asyncHandler(async (req, res) => {
    const allowed = ['fullName', 'phone', 'gender', 'bio'];
    if (req.user.role === 'DOCTOR') allowed.push('specialization', 'licenseNo');

    const data = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key] || null;
    }
    if ('dob' in req.body) data.dob = req.body.dob ? new Date(req.body.dob) : null;

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ user: publicUser(user) });
  })
);

router.post(
  '/me/avatar',
  requireAuth,
  avatarUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });
    res.json({ user: publicUser(user), avatarUrl });
  })
);

export default router;
