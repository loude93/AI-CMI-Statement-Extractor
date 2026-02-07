<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zA1aP6na8iM9OMa1OijJJjEfjJygMYRS

## Run Locally (Frontend + Backend)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create your environment file:
   `cp .env.example .env.local`
3. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
4. Start frontend and backend together:
   `npm run dev`

The frontend runs on `http://localhost:5173` and proxies `/api/*` requests to the backend on `http://localhost:8787`.

## Backend API

- `GET /api/health` → health check
- `POST /api/extract` → extracts statement rows from `{ fileBase64, fileType }`

You can also run only the backend:
- `npm run start:server`

## Build for production

Run:
`npm run build`
