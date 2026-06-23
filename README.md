# CollabServe AI

Realtime MERN workspace For code editors: auth, projects, collaborators, Socket.IO chat, `@ai` code generation, editable file trees, and WebContainer preview.

## Setup

Install all dependencies:

```bash
npm install
npm run install:all
```

Create environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

The root `.env.example` is a consolidated reference. The running apps read `backend/.env` and `frontend/.env`, so update `backend/.env` with your MongoDB connection string, JWT secret, and Gemini key.

Run the full project:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3000`

## Environment

Required backend values:

- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`

Optional backend values:

- `PORT`
- `CLIENT_URL`
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `GEMINI_MODEL`

Required frontend value:

- `VITE_API_URL`

## Validation Checklist

- Frontend: authentication flow, project dashboard, project workspace, validation messages, loading states, empty states, responsive layout.
- Backend: REST route coverage, input validation, JWT middleware, password hashing, owner-only collaborator control, MongoDB relationships.
- Visual quality: consistent spacing, readable typography, clear status feedback, mobile-friendly structure.

## Scripts

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
```

## Security Notes

Keep API keys only in backend environment files. Vite exposes `VITE_*` values to the browser, so Gemini keys must never be placed in `frontend/.env`.
