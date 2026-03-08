# ACKO MER AI — Medical Transcription & AI Summary System

A production-ready medical transcription platform for healthcare professionals. Record patient consultations, get automatic transcription via OpenAI Whisper, and generate structured medical summaries using GPT-4.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Grok API key 

### 1. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your `OPENAI_API_KEY`.

### 2. Start with Docker

```bash
docker-compose up -d
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### 3. Create an Account

Open http://localhost:3000, click **Register**, and create your doctor account.

---

## 🛠️ Manual Setup (without Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # Edit with your API keys
npm run dev             # Starts on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm start               # Starts on port 3000
```

Requires MongoDB and Redis running locally.

---

## 📖 Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Audio Recording** | Record consultations directly in browser |
| 📝 **Whisper Transcription** | Auto-transcribe with OpenAI Whisper |
| 🤖 **GPT-4 Summaries** | Structured SOAP/APSO medical notes |
| 🏥 **ICD-10 & CPT Codes** | AI-suggested medical billing codes |
| ⚡ **Real-time Updates** | Socket.IO for live transcription status |
| 📤 **Export** | Download as JSON or text |
| 🔐 **JWT Auth** | Secure role-based authentication |
| ⚡ **Redis Cache** | Fast session and transcript caching |

## 🏗️ Architecture

```
Frontend (React 18 + MUI)
    ↓
Backend API (Node.js + Express)
    ├── MongoDB (sessions, transcripts, summaries)
    ├── Redis (caching, rate limiting)
    └── OpenAI API (Whisper + GPT-4)
```

## 📋 API Endpoints

```
POST   /api/auth/register          Register doctor account
POST   /api/auth/login             Login
GET    /api/sessions               List sessions
POST   /api/sessions               Create session
GET    /api/sessions/:id           Get session
PATCH  /api/sessions/:id/end       End session
POST   /api/transcribe/session/:id/upload    Upload & transcribe audio
GET    /api/transcribe/session/:id/transcriptions   Get transcripts
POST   /api/summaries/session/:id/generate   Generate AI summary
GET    /api/summaries/session/:id            Get summary
GET    /api/summaries/:id/export/:format     Export (json/text)
```

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for Whisper + GPT-4 | ✅ Yes |
| `MONGO_URI` | MongoDB connection string | ✅ Yes |
| `REDIS_URL` | Redis connection URL | Optional |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | ✅ Yes |
| `PORT` | Backend server port (default: 5000) | No |

## 🔒 Security

- JWT authentication with secure token validation
- Rate limiting (100 req/15min per IP)
- MongoDB injection prevention (mongo-sanitize)
- Security headers (Helmet.js)
- CORS configured for frontend domain

## 📄 License

MIT License — see LICENSE file.
