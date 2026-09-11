import { prisma } from '../prisma.js';

const studyInclude = {
  owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  aiResult: true,
  shares: {
    where: { revokedAt: null },
    include: {
      sharedWithDoctor: { select: { id: true, fullName: true, specialization: true, avatarUrl: true } },
    },
  },
};

/**
 * Returns { study, role } where role is 'OWNER' | 'DOCTOR' | 'ADMIN',
 * or null if the user may not see this study.
 */
export async function getAccessibleStudy(user, studyId) {
  const study = await prisma.study.findUnique({ where: { id: studyId }, include: studyInclude });
  if (!study) return null;

  if (user.role === 'ADMIN') return { study, role: 'ADMIN' };
  if (study.ownerId === user.id) return { study, role: 'OWNER' };

  if (user.role === 'DOCTOR') {
    const shared = study.shares.some((s) => s.sharedWithDoctorId === user.id);
    if (shared) return { study, role: 'DOCTOR' };
  }
  return null;
}

export { studyInclude };
