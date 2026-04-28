# CollabServe AI

Realtime MERN workspace inspired by the SOEN project video: auth, projects, collaborators, Socket.IO chat, `@ai` code generation, editable file trees, and WebContainer preview.

## Setup

1. Install dependencies:

   ```bash
   npm.cmd install
   npm.cmd install --prefix backend
   npm.cmd install --prefix frontend
   ```

2. Create environment files:

   ```bash
   copy backend\.env.example backend\.env
   copy frontend\.env.example frontend\.env
   ```

3. Update `backend/.env` with `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`. The default model is `gemini-3-flash-preview`, matching the Gemini JavaScript quickstart style.

4. Run the app:

   ```bash
   npm.cmd run dev
   ```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

## Security

- Keep `GEMINI_API_KEY` only in `backend/.env`.
- Do not add AI provider keys to `frontend/.env` because Vite exposes `VITE_*` values to browser code.
- The frontend calls only your backend API; Gemini requests are made from Node.js.
- `.env` and log files are ignored by Git.
