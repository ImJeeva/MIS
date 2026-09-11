import path from 'node:path';
import { prisma } from '../prisma.js';
import { analyzeImage } from './aiClient.js';
import { notify } from './notify.js';
import { uploadRoot } from '../middleware/upload.js';

function resolveStudyPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(uploadRoot, filePath);
}

/**
 * Runs the AI screening for one study and upserts its AiResult row.
 * Safe to call synchronously in a request — degrades to a FAILED row if the
 * AI service is unreachable. Returns the AiResult.
 */
export async function runAnalysis(study, { notifyOwner = true } = {}) {
  await prisma.aiResult.upsert({
    where: { studyId: study.id },
    create: { studyId: study.id, status: 'PENDING' },
    update: { status: 'PENDING', error: null },
  });

  const result = await analyzeImage(resolveStudyPath(study.filePath), study.fileMime);

  let aiResult;
  if (result.ok) {
    aiResult = await prisma.aiResult.update({
      where: { studyId: study.id },
      data: {
        status: 'DONE',
        prediction: result.prediction,
        label: result.label,
        confidence: result.confidence,
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        inferenceMs: result.inferenceMs,
        error: null,
      },
    });
    if (notifyOwner) {
      await notify(study.ownerId, {
        type: 'AI_RESULT',
        title: 'X-ray screening complete',
        body: `${study.title}: ${result.label}`,
        linkTo: `/app/studies/${study.id}`,
      });
    }
  } else {
    aiResult = await prisma.aiResult.update({
      where: { studyId: study.id },
      data: { status: 'FAILED', error: result.error },
    });
  }
  return aiResult;
}
