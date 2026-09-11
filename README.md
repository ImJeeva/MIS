# MIS — Medical Imaging Sharing

A secure web platform where **patients** upload chest X-rays and reports, connect
with a **doctor**, and share studies; doctors review shared studies and write
appointment notes; an **admin** verifies doctors and monitors the system. Every
uploaded chest X-ray also gets an **AI first-look screening** — a flag of
*Possible abnormality detected* / *No abnormality detected* with a confidence
score.

> The AI is a screening aid, **not** a diagnosis. A qualified doctor reviews every
> image and makes the clinical decision. This is a student project and is not for
> clinical use.

Backed by: Varshni et al., *"Pneumonia Detection Using CNN based Feature
Extraction"*, IEEE 2019 (DenseNet-169 feature extractor + classifier, binary
normal/abnormal chest X-ray classification).

---

## Architecture

```
client/       React 18 + Vite + Tailwind        -> http://localhost:5173
server/       Express + Prisma + MySQL           -> http://localhost:4000/api
ai-service/   FastAPI + Keras (DenseNet-169)     -> http://localhost:8000
```

Upload flow: patient uploads an X-ray → `server` stores the file → `server` calls
`ai-service /predict` → screening result is saved with the study → the UI reveals
it. If the AI service is down the upload still succeeds and the result is marked
*unavailable*.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MySQL** 8 running locally (or use `docker compose up -d db` — see note below)

---

## Setup

### 1. Database

Create a database and point the server at it.

```sql
CREATE DATABASE mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edit `server/.env` — `DATABASE_URL`. URL-encode special characters in the
password (`@` → `%40`):

```
DATABASE_URL="mysql://root:YOUR%40PASSWORD@localhost:3306/mis"
```

> No local MySQL? `docker compose up -d db` starts one on port **3307** with user
> `mis` / `mispass`. Then set
> `DATABASE_URL="mysql://mis:mispass@localhost:3307/mis"`.

### 2. Backend

```bash
cd server
npm install
npx prisma migrate dev        # create tables
npm run db:seed               # load demo data
npm run dev                   # http://localhost:4000
```

### 3. AI service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn app:app --port 8000
```

Runs in **heuristic mode** out of the box (no model file needed). To use the real
trained CNN, see [`ai-service/README.md`](ai-service/README.md).

### 4. Frontend

```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

### One command to run everything (after the first-time setup above)

From the repo root:

```bash
npm run dev
```

This starts **all three** — backend, frontend, and AI service — in one terminal
(colour-coded `server` / `client` / `ai`). Press `Ctrl+C` once to stop them all.

> Needs `python` on your PATH (tick "Add python.exe to PATH" in the Python
> installer). Check with `python --version`.

---

## Demo accounts

Password for all: **`Passw0rd!`**

| Role | Email |
|---|---|
| Admin | `admin@mis.local` |
| Doctor (verified) | `dr.meera@mis.local` |
| Doctor (pending verification) | `dr.arun@mis.local` |
| Patient | `ravi@mis.local` |
| Patient | `anita@mis.local` |
| Patient | `karthik@mis.local` |

The sign-in page has quick-login buttons that fill these in.

---

## Walkthrough for a demo

1. **Patient** (`ravi@mis.local`) → *Upload X-ray* → drop an image → see the
   screening result appear with a confidence gauge and the disclaimer.
   *(Use a real chest X-ray from the [Kaggle dataset](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia) for a convincing demo.)*
2. Patient → *My doctors* → connect with **Dr. Arun** (after step 5) or use the
   existing connection to **Dr. Meera**.
3. Open a study → **Share** → choose Dr. Meera.
4. **Doctor** (`dr.meera@mis.local`) → *Shared studies* → open it → zoom the
   viewer, download the file → open the patient → **Add note**.
5. **Admin** (`admin@mis.local`) → *Users* → **Verify** Dr. Arun → *Overview*
   shows the charts update.

---

## Project layout

```
server/
  prisma/schema.prisma      data model (User, Study, AiResult, Share, ...)
  prisma/seed.js            demo data + sample images
  src/routes/*.routes.js    REST endpoints
  src/middleware/auth.js    JWT auth + role guards
  src/services/aiClient.js  calls the AI microservice
  src/lib/studyAccess.js    who may see which study
client/
  src/pages/                screens (patient / doctor / admin + shared)
  src/components/            design-system UI + ConfidenceGauge, ImageViewer,
                            AssistantWidget (static rule-based help chat), ...
  src/lib/                   api client, auth context, react-query hooks
ai-service/
  app.py                    FastAPI: /predict, /health
  predictor.py              CNN + heuristic fallback
  train_colab.ipynb         one-time training on a free Colab GPU
```

---

## Tech notes

- **Auth**: JWT bearer tokens, bcrypt password hashes, role-based route guards
  (`PATIENT` / `DOCTOR` / `ADMIN`).
- **File storage**: on disk under `server/uploads/`. Study files are served only
  through `GET /api/studies/:id/file` after an authorization check; avatars are
  served statically.
- **Privacy**: a study is visible to its owner, any doctor it is actively shared
  with, and admins. Revoking a share cuts access immediately.
- **AI**: `ai-service` is stateless and swappable. `server` treats a failure as a
  soft error so uploads never block.
