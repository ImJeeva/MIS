import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { forbidden, notFound } from '../lib/httpError.js';
import { studyInclude } from '../lib/studyAccess.js';

const router = Router();

// Doctor: list connected (ACCEPTED) patients.
router.get(
  '/',
  requireAuth,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    const links = await prisma.doctorPatientLink.findMany({
      where: { doctorId: req.user.id, status: 'ACCEPTED' },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true, phone: true, gender: true, dob: true, avatarUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const patientIds = links.map((l) => l.patientId);
    const shareCounts = await prisma.share.groupBy({
      by: ['sharedById'],
      where: { sharedWithDoctorId: req.user.id, revokedAt: null, sharedById: { in: patientIds } },
      _count: { _all: true },
    });
    const byPatient = Object.fromEntries(shareCounts.map((s) => [s.sharedById, s._count._all]));

    res.json({
      patients: links.map((l) => ({
        ...l.patient,
        connectedSince: l.updatedAt,
        sharedStudies: byPatient[l.patientId] || 0,
      })),
    });
  })
);

// Doctor: one patient's shared studies + notes.
router.get(
  '/:id',
  requireAuth,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    const link = await prisma.doctorPatientLink.findUnique({
      where: { patientId_doctorId: { patientId: req.params.id, doctorId: req.user.id } },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true, phone: true, gender: true, dob: true, avatarUrl: true },
        },
      },
    });
    if (!link) throw notFound('Patient not found');
    if (link.status !== 'ACCEPTED') throw forbidden('Connection is not active');

    const shares = await prisma.share.findMany({
      where: { sharedWithDoctorId: req.user.id, sharedById: req.params.id, revokedAt: null },
      include: { study: { include: studyInclude } },
      orderBy: { createdAt: 'desc' },
    });

    const notes = await prisma.appointmentNote.findMany({
      where: { doctorId: req.user.id, patientId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { study: { select: { id: true, title: true } } },
    });

    res.json({
      patient: link.patient,
      studies: shares.map((s) => ({ ...s.study, share: { id: s.id, canDownload: s.canDownload, message: s.message } })),
      notes,
    });
  })
);

export default router;
