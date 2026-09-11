import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Verified doctors a patient can connect with. Includes this patient's link status.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').toString().trim();

    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isVerified: true,
        status: 'ACTIVE',
        ...(q
          ? {
              OR: [
                { fullName: { contains: q } },
                { specialization: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        specialization: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const links = await prisma.doctorPatientLink.findMany({
      where: { patientId: req.user.id },
      select: { doctorId: true, status: true },
    });
    const byDoctor = Object.fromEntries(links.map((l) => [l.doctorId, l.status]));

    res.json({
      doctors: doctors.map((d) => ({ ...d, linkStatus: byDoctor[d.id] || null })),
    });
  })
);

export default router;
