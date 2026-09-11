import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import doctorsRoutes from './doctors.routes.js';
import linksRoutes from './links.routes.js';
import studiesRoutes from './studies.routes.js';
import sharesRoutes from './shares.routes.js';
import notesRoutes from './notes.routes.js';
import notificationsRoutes from './notifications.routes.js';
import patientsRoutes from './patients.routes.js';
import adminRoutes from './admin.routes.js';
import { aiHealth } from '../services/aiClient.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'mis-server' }));
router.get(
  '/health/ai',
  asyncHandler(async (_req, res) => res.json(await aiHealth()))
);

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/links', linksRoutes);
router.use('/studies', studiesRoutes);
router.use('/shares', sharesRoutes);
router.use('/notes', notesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/patients', patientsRoutes);
router.use('/admin', adminRoutes);

export default router;
