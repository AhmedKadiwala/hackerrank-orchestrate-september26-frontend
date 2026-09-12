# Buy or Wait Frontend

Vite React frontend for the Buy or Wait financial decision explorer.

## Local Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Set `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Vercel

Use these settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set this Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

After Vercel gives you the production URL, add it to the backend Render variable:

```env
BACKEND_CORS_ORIGINS=https://your-vercel-app.vercel.app
```
