import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { publicUser } from '../lib/publicUser.js';
import { badRequest, unauthorized } from '../lib/httpError.js';
import { audit } from '../services/audit.js';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty(),
  body('role').isIn(['PATIENT', 'DOCTOR']),
  body('specialization').optional().trim(),
  body('licenseNo').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    const { email, password, fullName, role, specialization, licenseNo, phone, gender } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest('An account with that email already exists');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        fullName,
        role,
        phone: phone || null,
        gender: gender || null,
        specialization: role === 'DOCTOR' ? specialization || null : null,
        licenseNo: role === 'DOCTOR' ? licenseNo || null : null,
        isVerified: false,
      },
    });

    await audit(user.id, 'USER_REGISTERED', { targetType: 'User', targetId: user.id, meta: { role } });

    const token = signToken({ sub: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized('Invalid email or password');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');
    if (user.status === 'SUSPENDED') throw unauthorized('This account has been suspended');

    const token = signToken({ sub: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

export default router;
