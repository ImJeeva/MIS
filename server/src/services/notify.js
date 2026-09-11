import { prisma } from '../prisma.js';

/**
 * Creates an in-app notification. Fire-and-forget friendly — callers can await
 * or not; failures are logged, never thrown into the request path.
 */
export async function notify(userId, { type, title, body, linkTo }) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body: body ?? null, linkTo: linkTo ?? null },
    });
  } catch (err) {
    console.error('[notify] failed', err);
  }
}
