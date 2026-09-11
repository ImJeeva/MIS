import { validationResult } from 'express-validator';
import { HttpError, badRequest } from '../lib/httpError.js';

// Collects express-validator errors into a 400.
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, msg: e.msg }));
  next(badRequest('Validation failed', details));
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'That record already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File is too large' });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
}
