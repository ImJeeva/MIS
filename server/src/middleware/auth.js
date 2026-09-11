import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../prisma.js';
import { unauthorized, forbidden } from '../lib/httpError.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized('Missing bearer token');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw unauthorized('Invalid or expired token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized('Account not found');
  if (user.status === 'SUSPENDED') throw forbidden('Account suspended');

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(forbidden('You do not have access to this resource'));
  }
  next();
};
