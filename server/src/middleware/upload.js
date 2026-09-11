import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { env } from '../env.js';
import { badRequest } from '../lib/httpError.js';

export const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
export const studiesDir = path.join(uploadRoot, 'studies');
export const avatarsDir = path.join(uploadRoot, 'avatars');
fs.mkdirSync(studiesDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });

const STUDY_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function makeStorage(dir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '';
      cb(null, `${Date.now()}-${nanoid(10)}${ext}`);
    },
  });
}

export const upload = multer({
  storage: makeStorage(studiesDir),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!STUDY_MIME.has(file.mimetype)) {
      return cb(badRequest('Only JPG, PNG, WEBP or PDF files are allowed'));
    }
    cb(null, true);
  },
});

export const avatarUpload = multer({
  storage: makeStorage(avatarsDir),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype)) return cb(badRequest('Avatar must be an image'));
    cb(null, true);
  },
});
