# InterVexa — Part 2 Frontend

Complete React + Vite + TypeScript + Tailwind CSS frontend for InterVexa.

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- InterVexa Part 1 Express API running on port 5000
- MongoDB configured for the backend

## Install and run

```powershell
cd InterVexa
cd client
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173

## API connection

The frontend uses:

VITE_API_URL=http://localhost:5000/api

Authentication endpoints used:
- POST /auth/register
- POST /auth/login
- GET /auth/me
- PATCH /auth/profile
- POST /auth/refresh
- POST /auth/logout

## Included
- Premium dark landing page
- Login and registration
- JWT authentication integration
- Protected routes
- Responsive dashboard
- Interview setup
- Camera and microphone interview room
- Analytics dashboard
- Profile page
- 3D hover cards
- Tailwind CSS
