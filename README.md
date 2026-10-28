# YT-GenAI

An AI interview-strategy builder that analyzes a resume PDF against a target job description and generates interview-preparation material.

## Features

- Register and log in with email verification using one-time passwords.
- Upload a PDF resume and provide a self-description and job description for Gemini-powered analysis.
- Review role-match and ATS scores, strengths, weaknesses, missing skills, skill gaps, technical and behavioral interview questions, and a preparation plan.
- Save and revisit generated reports.
- Generate a tailored resume PDF from a saved report.
- Use an admin area for dashboard metrics, user management, report management, AI logs, analytics, and resume-upload review.

## Technology

- **Frontend:** React 19, React Router, Vite, Sass, Axios
- **Backend:** Node.js, Express 5
- **Data:** MongoDB with Mongoose
- **AI:** Google Gemini through `@google/genai`
- **Other backend integrations:** Nodemailer for verification email, Multer and `pdf-parse` for PDF resume processing, Puppeteer for PDF generation

## Architecture

```text
React/Vite browser app
        │ HTTP requests with an HTTP-only auth cookie
        ▼
Express API (localhost:3000)
   ├── Authentication and email OTP
   ├── Resume/interview analysis and PDF generation
   ├── Admin endpoints
   └── MongoDB via Mongoose
        └── Gemini API for analysis and resume content
```

The backend exposes `/health`, `/api/auth`, `/api/interview`, and `/api/admin` routes. The frontend currently calls the backend at `http://localhost:3000`; the Vite development server uses its default port unless configured otherwise. The backend listens on port `3000`.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (Vite 8 requirement)
- npm
- A MongoDB deployment or local MongoDB instance
- A Google Gemini API key
- SMTP credentials for email registration/verification

## Local setup

### 1. Configure the backend

```powershell
cd Backend
npm install
Copy-Item .env.example .env
```

Set the environment variables described below in `Backend/.env`. Do not commit that file. Start the API:

```powershell
npm run dev
```

The backend connects to MongoDB before listening on `http://localhost:3000`. Check `http://localhost:3000/health` for service and database status.

### 2. Configure and run the frontend

In a second terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The frontend API clients currently use the fixed backend URL `http://localhost:3000`.

### 3. Create an administrator

After configuring `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `Backend/.env`, run:

```powershell
cd Backend
npm run create-admin
```

`ADMIN_USERNAME` is optional and defaults to `admin`. The script creates an admin or promotes the matching existing account.

## Environment variables

Copy `Backend/.env.example` to `Backend/.env` and provide local values. No secret values belong in this repository.

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs authentication tokens |
| `GOOGLE_GENAI_API_KEY` | Yes | Authenticates Gemini API requests |
| `EMAIL_HOST` | For registration | SMTP host |
| `EMAIL_PORT` | For registration | SMTP port |
| `EMAIL_USER` | For registration | SMTP account |
| `EMAIL_PASS` | For registration | SMTP password |
| `EMAIL_SECURE` | Optional | Set to `true` when the SMTP connection uses TLS |
| `EMAIL_FROM` | Optional | Sender address; defaults to `EMAIL_USER` |
| `ADMIN_EMAIL` | For admin setup | Email address for the admin account |
| `ADMIN_PASSWORD` | For admin setup | Password for the admin account |
| `ADMIN_USERNAME` | Optional | Admin display name; defaults to `admin` |
| `NODE_ENV` | Optional | Set to `production` to enable secure auth cookies |

## Available scripts

| Directory | Command | Purpose |
|---|---|---|
| `Backend` | `npm run dev` | Start the API server |
| `Backend` | `npm start` | Start the API server |
| `Backend` | `npm run create-admin` | Create or promote an administrator |
| `Frontend` | `npm run dev` | Start the Vite development server |
| `Frontend` | `npm run build` | Create a production frontend build in `Frontend/dist` |
| `Frontend` | `npm run preview` | Preview a production frontend build |
| `Frontend` | `npm run lint` | Run ESLint |

There is no automated test suite configured yet; the backend `test` script is currently a placeholder.

## API overview

- **Authentication:** register, verify/resend OTP, log in/out, and fetch the current user.
- **Interviews:** generate a report, list the signed-in user's reports, fetch a report, and generate a resume PDF.
- **Administration:** dashboard, user block/delete, report management, AI-log review, analytics, and resume-upload review.

## Data handling and security

Resume text, self-descriptions, job descriptions, and generated reports are stored in MongoDB. Resume and job-related text is sent to the configured Gemini API to generate analysis and resume content. Only use information you are authorized to process, and review the data handling terms and retention settings of the configured providers before using real personal data.

The current frontend API URL and backend CORS allowlist are configured for local development. Review and configure both for any deployment; the repository does not include production deployment configuration.

## Current validation status

- `Frontend`: production build succeeds; Sass emits deprecation warnings.
- `Frontend`: ESLint currently reports existing errors and warnings.
- `Backend`: JavaScript syntax checks pass; automated tests are not configured.
