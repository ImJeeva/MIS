import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'seed-assets');
const STUDIES_DIR = path.join(__dirname, '..', 'uploads', 'studies');

const PW = 'Passw0rd!';

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// Accepts a base name ("pneumonia_01") OR a full filename. Picks a real photo
// extension first (jpg/jpeg/webp) over the synthetic .png placeholder, so you
// can just drop real chest X-rays into server/seed-assets/ and re-seed.
function copyAsset(nameOrBase) {
  fs.mkdirSync(STUDIES_DIR, { recursive: true });
  const base = nameOrBase.replace(/\.(jpg|jpeg|png|webp)$/i, '');

  let src = null;
  for (const ext of ['.jpg', '.jpeg', '.webp', '.png']) {
    const candidate = path.join(ASSETS, base + ext);
    if (fs.existsSync(candidate)) {
      src = candidate;
      break;
    }
  }
  if (!src) throw new Error(`No seed asset found for "${nameOrBase}" in ${ASSETS}`);

  const ext = path.extname(src).toLowerCase();
  const filename = `seed-${Date.now()}-${nanoid(8)}${ext}`;
  fs.copyFileSync(src, path.join(STUDIES_DIR, filename));
  return {
    filename,
    size: fs.statSync(src).size,
    relPath: `studies/${filename}`,
    mime: MIME[ext] || 'image/png',
    origName: path.basename(src),
  };
}

async function reset() {
  // Order matters for FK constraints.
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointmentNote.deleteMany();
  await prisma.share.deleteMany();
  await prisma.aiResult.deleteMany();
  await prisma.study.deleteMany();
  await prisma.doctorPatientLink.deleteMany();
  await prisma.user.deleteMany();
  // wipe seeded study files
  if (fs.existsSync(STUDIES_DIR)) {
    for (const f of fs.readdirSync(STUDIES_DIR)) {
      if (f.startsWith('seed-')) fs.unlinkSync(path.join(STUDIES_DIR, f));
    }
  }
}

async function main() {
  console.log('Resetting data...');
  await reset();

  const passwordHash = await bcrypt.hash(PW, 10);

  const admin = await prisma.user.create({
    data: {
      role: 'ADMIN',
      email: 'admin@mis.local',
      passwordHash,
      fullName: 'System Administrator',
      isVerified: true,
    },
  });

  const drMeera = await prisma.user.create({
    data: {
      role: 'DOCTOR',
      email: 'dr.meera@mis.local',
      passwordHash,
      fullName: 'Meera Krishnan',
      specialization: 'Pulmonology',
      licenseNo: 'TN-PULM-4821',
      bio: 'Consultant pulmonologist with 12 years of experience in respiratory medicine and chest imaging.',
      isVerified: true,
      phone: '+91 98400 11223',
    },
  });

  const drArun = await prisma.user.create({
    data: {
      role: 'DOCTOR',
      email: 'dr.arun@mis.local',
      passwordHash,
      fullName: 'Arun Prakash',
      specialization: 'Radiology',
      licenseNo: 'TN-RAD-7799',
      bio: 'Radiologist focused on thoracic imaging.',
      isVerified: false,
      phone: '+91 99620 55440',
    },
  });

  const patients = await Promise.all(
    [
      { email: 'ravi@mis.local', fullName: 'Ravi Sharma', gender: 'Male', phone: '+91 90031 22110' },
      { email: 'anita@mis.local', fullName: 'Anita Desai', gender: 'Female', phone: '+91 90042 88771' },
      { email: 'karthik@mis.local', fullName: 'Karthik Rao', gender: 'Male', phone: '+91 90055 34567' },
    ].map((p) =>
      prisma.user.create({
        data: { role: 'PATIENT', passwordHash, ...p },
      })
    )
  );
  const [ravi, anita, karthik] = patients;

  // Links: ravi & anita connected to Dr. Meera (accepted); karthik pending.
  await prisma.doctorPatientLink.createMany({
    data: [
      { patientId: ravi.id, doctorId: drMeera.id, status: 'ACCEPTED' },
      { patientId: anita.id, doctorId: drMeera.id, status: 'ACCEPTED' },
      { patientId: karthik.id, doctorId: drMeera.id, status: 'PENDING', message: 'Would like a second opinion on my chest X-ray.' },
    ],
  });

  // Studies + AI results.
  const studyPlan = [
    { owner: ravi, title: 'Chest X-ray — 02 Sep', asset: 'pneumonia_01.png', pred: 'ABNORMAL', conf: 0.912 },
    { owner: ravi, title: 'Follow-up Chest X-ray', asset: 'normal_01.png', pred: 'NORMAL', conf: 0.968 },
    { owner: anita, title: 'Chest X-ray — routine', asset: 'normal_02.png', pred: 'NORMAL', conf: 0.941 },
    { owner: anita, title: 'Chest X-ray — persistent cough', asset: 'pneumonia_02.png', pred: 'ABNORMAL', conf: 0.874 },
    { owner: karthik, title: 'Chest X-ray — pre-op', asset: 'normal_03.png', pred: 'NORMAL', conf: 0.955 },
  ];

  const studies = [];
  for (const p of studyPlan) {
    const a = copyAsset(p.asset);
    const study = await prisma.study.create({
      data: {
        ownerId: p.owner.id,
        uploaderId: p.owner.id,
        type: 'XRAY',
        title: p.title,
        fileName: a.origName,
        filePath: a.relPath,
        fileMime: a.mime,
        fileSizeBytes: a.size,
        bodyPart: 'Chest',
        aiResult: {
          create: {
            status: 'DONE',
            prediction: p.pred,
            label: p.pred === 'ABNORMAL' ? 'Possible abnormality detected' : 'No abnormality detected',
            confidence: p.conf,
            modelName: 'DenseNet169-TL',
            modelVersion: 'seed-1.0',
            inferenceMs: 320 + Math.floor(Math.random() * 200),
          },
        },
      },
    });
    studies.push({ ...study, ownerRef: p.owner });
  }

  // A report-type study too.
  const rep = copyAsset('normal_01');
  await prisma.study.create({
    data: {
      ownerId: anita.id,
      uploaderId: anita.id,
      type: 'REPORT',
      title: 'Blood work summary (PDF placeholder)',
      fileName: `report${path.extname(rep.origName)}`,
      filePath: rep.relPath,
      fileMime: rep.mime,
      fileSizeBytes: rep.size,
      bodyPart: 'N/A',
      notes: 'Uploaded for Dr. Meera to review alongside the X-ray.',
    },
  });

  // Shares: ravi shares his abnormal + follow-up; anita shares her abnormal one.
  const shareData = [
    { study: studies[0], by: ravi },
    { study: studies[1], by: ravi },
    { study: studies[3], by: anita },
  ];
  for (const s of shareData) {
    await prisma.share.create({
      data: {
        studyId: s.study.id,
        sharedById: s.by.id,
        sharedWithDoctorId: drMeera.id,
        canDownload: true,
        message: 'Please review when you can.',
      },
    });
  }

  // Appointment notes from Dr. Meera.
  await prisma.appointmentNote.create({
    data: {
      patientId: ravi.id,
      doctorId: drMeera.id,
      studyId: studies[0].id,
      title: 'Initial review — right lower zone haziness',
      body: 'Screening flag noted. Clinically consistent with early community-acquired pneumonia. Started on oral antibiotics; review in 5 days with a repeat film.',
    },
  });
  await prisma.appointmentNote.create({
    data: {
      patientId: anita.id,
      doctorId: drMeera.id,
      studyId: studies[3].id,
      title: 'Persistent cough — advise repeat imaging',
      body: 'Subtle opacity on the left. Recommend a lateral view and CBC. Follow up next week.',
    },
  });

  // Notifications.
  await prisma.notification.createMany({
    data: [
      { userId: drMeera.id, type: 'STUDY_SHARED', title: 'A study was shared with you', body: 'Ravi Sharma shared "Chest X-ray — 02 Sep"', linkTo: `/app/studies/${studies[0].id}` },
      { userId: drMeera.id, type: 'LINK_REQUEST', title: 'New connection request', body: 'Karthik Rao wants to connect with you', linkTo: '/app/patients' },
      { userId: ravi.id, type: 'AI_RESULT', title: 'X-ray screening complete', body: 'Chest X-ray — 02 Sep: Possible abnormality detected', linkTo: `/app/studies/${studies[0].id}` },
      { userId: ravi.id, type: 'NOTE_ADDED', title: 'New appointment note', body: 'Dr. Meera Krishnan: Initial review — right lower zone haziness', linkTo: '/app/notes' },
      { userId: anita.id, type: 'NOTE_ADDED', title: 'New appointment note', body: 'Dr. Meera Krishnan: Persistent cough — advise repeat imaging', linkTo: '/app/notes' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: 'SEED_RUN', meta: { note: 'demo data loaded' } },
      { actorId: ravi.id, action: 'STUDY_UPLOADED', targetType: 'Study', targetId: studies[0].id },
      { actorId: ravi.id, action: 'STUDY_SHARED', targetType: 'Study', targetId: studies[0].id, meta: { doctorId: drMeera.id } },
    ],
  });

  console.log('\nSeed complete. Accounts (password for all): ' + PW);
  console.table([
    { role: 'ADMIN', email: 'admin@mis.local' },
    { role: 'DOCTOR (verified)', email: 'dr.meera@mis.local' },
    { role: 'DOCTOR (pending)', email: 'dr.arun@mis.local' },
    { role: 'PATIENT', email: 'ravi@mis.local' },
    { role: 'PATIENT', email: 'anita@mis.local' },
    { role: 'PATIENT', email: 'karthik@mis.local' },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
