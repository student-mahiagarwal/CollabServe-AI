# CollabServe AI

CollabServe AI is a full-stack realtime coding workspace built with React, Vite, Tailwind CSS, Express, MongoDB, Socket.IO, JWT authentication, and Gemini-powered code assistance.

The application supports account registration and login, protected project dashboards, collaborative project membership, realtime chat, `@ai` file generation, editable file trees, WebContainer execution, terminal output, and browser preview.

## Features

- JWT-based registration, login, profile bootstrapping, and logout token blacklisting.
- Project dashboard with search, project metrics, empty states, loading states, and error messages.
- Project-level collaboration using MongoDB project membership.
- Owner-only collaborator management for role-based access control.
- Socket.IO rooms scoped by authenticated project access.
- Gemini backend integration for JSON-based AI file generation.
- Browser-side file editing with saved project file trees.
- WebContainer mounting, install, run, terminal output, and iframe preview.
- Responsive layouts for dashboard and project workspace views.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, lucide-react, socket.io-client, axios, markdown-to-jsx, highlight.js, WebContainer API.
- Backend: Node.js, Express 5, MongoDB, Mongoose, Socket.IO, JWT, bcrypt, express-validator, cookie-parser, morgan.
- Optional services: Redis for logout blacklist persistence, Gemini API for AI responses.

## Project Structure

```text
FinalProject/
  backend/
    app.js
    server.js
    controllers/
    db/
    middleware/
    models/
    routes/
    services/
  frontend/
    index.html
    src/
      config/
      context/
      routes/
      screens/
  .env.example
  .gitignore
  package.json
  README.md
```

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
