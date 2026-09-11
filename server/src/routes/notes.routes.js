import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../lib/httpError.js';
import { notify } from '../services/notify.js';

const router = Router();

const noteInclude = {
  patient: { select: { id: true, fullName: true, avatarUrl: true } },
  doctor: { select: { id: true, fullName: true, specialization: true, avatarUrl: true } },
  study: { select: { id: true, title: true } },
};

// List notes (role-aware). Optional ?patientId= for a doctor viewing one patient.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'DOCTOR'
        ? { doctorId: req.user.id, ...(req.query.patientId ? { patientId: String(req.query.patientId) } : {}) }
        : { patientId: req.user.id };
    const notes = await prisma.appointmentNote.findMany({
      where,
      include: noteInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ notes });
  })
);

// Doctor creates an appointment note for a connected patient.
router.post(
  '/',
  requireAuth,
  requireRole('DOCTOR'),
  body('patientId').notEmpty(),
  body('title').trim().notEmpty(),
  body('body').trim().notEmpty(),
  body('studyId').optional({ nullable: true }),
  validate,
  asyncHandler(async (req, res) => {
    const { patientId, title, body: text, studyId } = req.body;

    const link = await prisma.doctorPatientLink.findUnique({
      where: { patientId_doctorId: { patientId, doctorId: req.user.id } },
    });
    if (!link || link.status !== 'ACCEPTED') throw badRequest('Not connected to this patient');

    if (studyId) {
      const study = await prisma.study.findUnique({ where: { id: studyId } });
      if (!study || study.ownerId !== patientId) throw badRequest('Invalid study for this patient');
    }

    const note = await prisma.appointmentNote.create({
      data: { patientId, doctorId: req.user.id, title, body: text, studyId: studyId || null },
      include: noteInclude,
    });

    await notify(patientId, {
      type: 'NOTE_ADDED',
      title: 'New appointment note',
      body: `Dr. ${req.user.fullName}: ${title}`,
      linkTo: '/app/notes',
    });

    res.status(201).json({ note });
  })
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('DOCTOR'),
  body('title').optional().trim().notEmpty(),
  body('body').optional().trim().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const note = await prisma.appointmentNote.findUnique({ where: { id: req.params.id } });
    if (!note) throw notFound('Note not found');
    if (note.doctorId !== req.user.id) throw forbidden();

    const data = {};
    if ('title' in req.body) data.title = req.body.title;
    if ('body' in req.body) data.body = req.body.body;

    const updated = await prisma.appointmentNote.update({
      where: { id: note.id },
      data,
      include: noteInclude,
    });
    res.json({ note: updated });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    const note = await prisma.appointmentNote.findUnique({ where: { id: req.params.id } });
    if (!note) throw notFound('Note not found');
    if (note.doctorId !== req.user.id) throw forbidden();
    await prisma.appointmentNote.delete({ where: { id: note.id } });
    res.json({ ok: true });
  })
);

export default router;
