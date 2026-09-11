import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../lib/httpError.js';
import { notify } from '../services/notify.js';

const router = Router();

const linkInclude = {
  patient: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
  doctor: {
    select: { id: true, fullName: true, email: true, avatarUrl: true, specialization: true },
  },
};

// List my connections (role-aware).
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'DOCTOR' ? { doctorId: req.user.id } : { patientId: req.user.id };
    const links = await prisma.doctorPatientLink.findMany({
      where,
      include: linkInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ links });
  })
);

// Patient requests a connection to a doctor.
router.post(
  '/',
  requireAuth,
  requireRole('PATIENT'),
  body('doctorId').notEmpty(),
  body('message').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    const { doctorId, message } = req.body;
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: 'DOCTOR', isVerified: true, status: 'ACTIVE' },
    });
    if (!doctor) throw notFound('Doctor not found or not verified');

    const existing = await prisma.doctorPatientLink.findUnique({
      where: { patientId_doctorId: { patientId: req.user.id, doctorId } },
    });
    if (existing && existing.status !== 'REJECTED') {
      throw badRequest(`Connection already ${existing.status.toLowerCase()}`);
    }

    const link = existing
      ? await prisma.doctorPatientLink.update({
          where: { id: existing.id },
          data: { status: 'PENDING', message: message || null },
          include: linkInclude,
        })
      : await prisma.doctorPatientLink.create({
          data: { patientId: req.user.id, doctorId, message: message || null },
          include: linkInclude,
        });

    await notify(doctorId, {
      type: 'LINK_REQUEST',
      title: 'New connection request',
      body: `${req.user.fullName} wants to connect with you`,
      linkTo: '/app/patients',
    });

    res.status(201).json({ link });
  })
);

// Doctor accepts / rejects a request.
router.patch(
  '/:id',
  requireAuth,
  requireRole('DOCTOR'),
  body('status').isIn(['ACCEPTED', 'REJECTED']),
  validate,
  asyncHandler(async (req, res) => {
    const link = await prisma.doctorPatientLink.findUnique({ where: { id: req.params.id } });
    if (!link) throw notFound('Request not found');
    if (link.doctorId !== req.user.id) throw forbidden();

    const updated = await prisma.doctorPatientLink.update({
      where: { id: link.id },
      data: { status: req.body.status },
      include: linkInclude,
    });

    await notify(link.patientId, {
      type: 'LINK_UPDATE',
      title: `Connection ${req.body.status.toLowerCase()}`,
      body: `Dr. ${req.user.fullName} ${req.body.status === 'ACCEPTED' ? 'accepted' : 'declined'} your request`,
      linkTo: '/app/doctors',
    });

    res.json({ link: updated });
  })
);

export default router;
