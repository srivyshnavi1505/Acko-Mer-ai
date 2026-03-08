# 🏥 ACKO MER AI — Medical Encounter Recording & AI System

AI-powered medical encounter recording, transcription, and SOAP note generation system for healthcare professionals.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-blue)
![AI](https://img.shields.io/badge/AI-Groq%20Whisper%20%7C%20LLaMA%203.3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (running as service)
- Redis (running as service)
- **Groq API Key** — FREE at [console.groq.com](https://console.groq.com)

### 1. Configure Environment
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` and set your `GROQ_API_KEY`.

### 2. Start Backend
```bash
cd backend
npm install
npm run dev       # Starts on port 5000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm start         # Starts on port 3000
```

### 4. Open the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

Open http://localhost:3000, click **Register**, and create your doctor account.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Audio Recording** | Record consultations directly in browser |
| 🤖 **Whisper Transcription** | Auto-transcribe using Groq Whisper Large V3 |
| 📋 **SOAP Note Generation** | Structured medical notes via LLaMA 3.3-70B |
| 🏷️ **ICD-10 Code Suggestions** | AI-suggested diagnosis codes |
| ⚡ **Real-time Updates** | Socket.IO for live transcription status |
| 👥 **Multi-Doctor Support** | Each doctor sees only their own sessions |
| 🌙 **Dark Mode** | Easy on the eyes during long shifts |
| 📤 **Export** | Download summaries as JSON or text |
| 🔐 **JWT Auth** | Secure role-based authentication |
| ⚡ **Redis Cache** | Fast session and transcript caching |

---

## 🏗️ Architecture
```
Frontend (React 18 + Material UI)
    ↓
Backend API (Node.js + Express)
    ├── MongoDB (sessions, transcripts, summaries)
    ├── Redis (caching, rate limiting)
    └── Groq API
            ├── Whisper Large V3 (transcription)
            └── LLaMA 3.3-70B (SOAP notes & ICD codes)
```

---

## 🤖 AI Models Used (All FREE via Groq)

| Task | Model | Speed |
|------|-------|-------|
| Audio Transcription | `whisper-large-v3` | ~1-2 sec |
| SOAP Note Generation | `llama-3.3-70b-versatile` | ~1-2 sec |
| ICD-10 Code Suggestion | `llama-3.3-70b-versatile` | ~1-2 sec |

> **Groq is completely free** for development with generous rate limits. No credit card required.

---

## 📋 API Endpoints
```
POST   /api/auth/register                            Register doctor account
POST   /api/auth/login                               Login
GET    /api/sessions                                 List sessions
POST   /api/sessions                                 Create session
GET    /api/sessions/:id                             Get session
PATCH  /api/sessions/:id/end                         End session
POST   /api/transcribe/session/:id/upload            Upload & transcribe audio
GET    /api/transcribe/session/:id/transcriptions    Get transcripts
POST   /api/summaries/session/:id/generate           Generate AI summary
GET    /api/summaries/session/:id                    Get summary
GET    /api/summaries/:id/export/:format             Export (json/text)
```

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key from console.groq.com | ✅ Yes |
| `MONGO_URI` | MongoDB connection string | ✅ Yes |
| `REDIS_URL` | Redis connection URL | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | ✅ Yes |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ Yes |
| `PORT` | Backend server port (default: 5000) | No |

---

## 📁 Project Structure
```
acko-mer-ai/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Redis, Socket, Logger
│   │   ├── controllers/    # Auth, Sessions, Transcription, Summary
│   │   ├── middleware/     # Auth, Error handling, Upload, Validation
│   │   ├── models/         # User, Session, Transcript, Summary
│   │   ├── routes/         # API routes
│   │   ├── services/       # Groq AI service (Whisper + LLaMA)
│   │   └── utils/          # Helpers, AppError
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/     # UI components
│       ├── context/        # Auth, Session, Theme context
│       ├── hooks/          # useRecording, useSocket
│       ├── pages/          # Auth, Dashboard, Session pages
│       └── services/       # API, Socket, Audio services
└── nginx/
```

---

## 🔒 Security

- JWT authentication with secure token validation
- Rate limiting (100 req/15min per IP)
- MongoDB injection prevention (mongo-sanitize)
- Security headers (Helmet.js)
- CORS configured for frontend domain
- `.env` never committed — all secrets in environment variables

---

## 📋 Roadmap

- [x] Authentication & Multi-doctor support
- [x] Audio recording & upload
- [x] AI transcription (Groq Whisper)
- [x] SOAP note generation (LLaMA 3.3)
- [x] Dark mode
- [ ] Patient Profile System
- [ ] Prescription PDF Generator
- [ ] Speaker Diarization (Doctor vs Patient)
- [ ] Medical Entity Extraction
- [ ] Analytics Dashboard
- [ ] Multi-clinic Support

---

## ⚠️ Important Notes


- Medical data is sensitive — keep your repository **private** , the data thats currently being used is dummy data
- Groq free tier has rate limits — suitable for development and small clinics

---

## 📄 License

MIT License — see LICENSE file.

---

Built with ❤️ for healthcare professionals