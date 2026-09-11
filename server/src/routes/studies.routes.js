import path from 'node:path';
import fs from 'node:fs';
import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, uploadRoot } from '../middleware/upload.js';
import { forbidden, notFound, badRequest } from '../lib/httpError.js';
import { getAccessibleStudy, studyInclude } from '../lib/studyAccess.js';
import { runAnalysis } from '../services/runAnalysis.js';
import { audit } from '../services/audit.js';

const router = Router();

// Create a study (upload). Patients upload their own; XRAY triggers AI screening.
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['XRAY', 'REPORT']),
  body('bodyPart').optional().trim(),
  body('notes').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('A file is required');
    if (req.user.role !== 'PATIENT') throw forbidden('Only patients can upload studies');

    const relPath = path.join('studies', req.file.filename).replace(/\\/g, '/');

    const study = await prisma.study.create({
      data: {
        ownerId: req.user.id,
        uploaderId: req.user.id,
        type: req.body.type,
        title: req.body.title,
        fileName: req.file.originalname,
        filePath: relPath,
        fileMime: req.file.mimetype,
        fileSizeBytes: req.file.size,
        bodyPart: req.body.bodyPart || 'Chest',
        notes: req.body.notes || null,
      },
    });

    await audit(req.user.id, 'STUDY_UPLOADED', { targetType: 'Study', targetId: study.id });

    let aiResult = null;
    if (study.type === 'XRAY' && req.file.mimetype.startsWith('image/')) {
      aiResult = await runAnalysis(study, { notifyOwner: false });
    }

    const full = await prisma.study.findUnique({ where: { id: study.id }, include: studyInclude });
    res.status(201).json({ study: full, aiResult });
  })
);

// List studies (role-aware): patient -> own; doctor -> shared with them.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    const typeFilter = type === 'XRAY' || type === 'REPORT' ? { type } : {};

    if (req.user.role === 'DOCTOR') {
      const shares = await prisma.share.findMany({
        where: { sharedWithDoctorId: req.user.id, revokedAt: null },
        include: { study: { include: studyInclude } },
        orderBy: { createdAt: 'desc' },
      });
      const studies = shares
        .map((s) => s.study)
        .filter((st) => (typeFilter.type ? st.type === typeFilter.type : true));
      return res.json({ studies });
    }

    const studies = await prisma.study.findMany({
      where: { ownerId: req.user.id, ...typeFilter },
      include: studyInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ studies });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await getAccessibleStudy(req.user, req.params.id);
    if (!access) throw notFound('Study not found');
    res.json({ study: access.study, myRole: access.role });
  })
);

// Permission-checked file download / inline view.
router.get(
  '/:id/file',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await getAccessibleStudy(req.user, req.params.id);
    if (!access) throw notFound('Study not found');

    const { study, role } = access;
    if (role === 'DOCTOR') {
      const share = study.shares.find((s) => s.sharedWithDoctorId === req.user.id);
      if (share && share.canDownload === false && req.query.download === '1') {
        throw forbidden('Downloading is disabled for this share');
      }
    }

    const abs = path.join(uploadRoot, study.filePath);
    if (!fs.existsSync(abs)) throw notFound('File is missing on disk');

    res.setHeader('Content-Type', study.fileMime);
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${study.fileName}"`);
    }
    fs.createReadStream(abs).pipe(res);
  })
);

// Re-run AI screening (owner or admin).
router.post(
  '/:id/analyze',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await getAccessibleStudy(req.user, req.params.id);
    if (!access) throw notFound('Study not found');
    if (!['OWNER', 'ADMIN'].includes(access.role)) throw forbidden();
    if (access.study.type !== 'XRAY') throw badRequest('Only X-ray studies can be screened');

    const aiResult = await runAnalysis(access.study, { notifyOwner: false });
    res.json({ aiResult });
  })
);

router.get(
  '/:id/ai',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await getAccessibleStudy(req.user, req.params.id);
    if (!access) throw notFound('Study not found');
    res.json({ aiResult: access.study.aiResult });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await getAccessibleStudy(req.user, req.params.id);
    if (!access) throw notFound('Study not found');
    if (!['OWNER', 'ADMIN'].includes(access.role)) throw forbidden();

    const abs = path.join(uploadRoot, access.study.filePath);
    await prisma.study.delete({ where: { id: access.study.id } });
    fs.promises.unlink(abs).catch(() => {});
    await audit(req.user.id, 'STUDY_DELETED', { targetType: 'Study', targetId: req.params.id });
    res.json({ ok: true });
  })
);

export default router;
