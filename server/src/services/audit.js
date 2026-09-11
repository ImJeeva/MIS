import { prisma } from '../prisma.js';

export async function audit(actorId, action, { targetType, targetId, meta } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        meta: meta ?? undefined,
      },
    });
  } catch (err) {
    console.error('[audit] failed', err);
  }
}
