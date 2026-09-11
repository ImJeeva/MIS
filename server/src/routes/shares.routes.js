import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../lib/httpError.js';
import { notify } from '../services/notify.js';
import { audit } from '../services/audit.js';

const router = Router();

const shareInclude = {
  study: { select: { id: true, title: true, type: true } },
  sharedWithDoctor: { select: { id: true, fullName: true, specialization: true, avatarUrl: true } },
  sharedBy: { select: { id: true, fullName: true } },
};

// List shares (role-aware).
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'DOCTOR'
        ? { sharedWithDoctorId: req.user.id, revokedAt: null }
        : { sharedById: req.user.id };
    const shares = await prisma.share.findMany({
      where,
      include: shareInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ shares });
  })
);

// Patient shares one of their studies with a connected doctor.
router.post(
  '/',
  requireAuth,
  requireRole('PATIENT'),
  body('studyId').notEmpty(),
  body('doctorId').notEmpty(),
  body('canDownload').optional().isBoolean(),
  body('message').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    const { studyId, doctorId, canDownload = true, message } = req.body;

    const study = await prisma.study.findUnique({ where: { id: studyId } });
    if (!study || study.ownerId !== req.user.id) throw notFound('Study not found');

    const link = await prisma.doctorPatientLink.findUnique({
      where: { patientId_doctorId: { patientId: req.user.id, doctorId } },
    });
    if (!link || link.status !== 'ACCEPTED') {
      throw badRequest('You can only share with a doctor you are connected to');
    }

    const existing = await prisma.share.findUnique({
      where: { studyId_sharedWithDoctorId: { studyId, sharedWithDoctorId: doctorId } },
    });

    const share = existing
      ? await prisma.share.update({
          where: { id: existing.id },
          data: { revokedAt: null, canDownload: !!canDownload, message: message || null },
          include: shareInclude,
        })
      : await prisma.share.create({
          data: {
            studyId,
            sharedById: req.user.id,
            sharedWithDoctorId: doctorId,
            canDownload: !!canDownload,
            message: message || null,
          },
          include: shareInclude,
        });

    await notify(doctorId, {
      type: 'STUDY_SHARED',
      title: 'A study was shared with you',
      body: `${req.user.fullName} shared "${study.title}"`,
      linkTo: `/app/studies/${studyId}`,
    });
    await audit(req.user.id, 'STUDY_SHARED', {
      targetType: 'Study',
      targetId: studyId,
      meta: { doctorId },
    });

    res.status(201).json({ share });
  })
);

// Revoke a share (patient who created it, or admin).
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const share = await prisma.share.findUnique({ where: { id: req.params.id } });
    if (!share) throw notFound('Share not found');
    if (req.user.role !== 'ADMIN' && share.sharedById !== req.user.id) throw forbidden();

    await prisma.share.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    await audit(req.user.id, 'SHARE_REVOKED', { targetType: 'Share', targetId: share.id });
    res.json({ ok: true });
  })
);

export default router;
