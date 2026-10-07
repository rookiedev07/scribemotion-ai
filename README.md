# ScribeMotion AI 🎬

> **AI-powered video subtitle generator** — Upload a video, transcribe audio with word-level timestamps using Whisper, preview animated captions in real time, customize styles, and export a burned-in MP4.

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Node%20%2B%20FFmpeg-indigo)
![AI](https://img.shields.io/badge/AI-OpenAI%20Whisper-orange)

---

## ✨ Features

- 🎙️ **Real AI transcription** — local Whisper model via HuggingFace `transformers` (no API key needed by default)
- ⚡ **Word-level timestamps** — each word highlighted exactly as it's spoken
- 🎨 **8 caption presets** — TikTok Viral, Bold Punch, Neon Glow, Cinema, Fire Drop, and more
- 📐 **Responsive font scaling** — subtitles scale to the actual video container width
- 🖊️ **Inline editor** — edit, split, or delete caption segments
- 🎬 **FFmpeg burn-in** — exports `.mp4` with embedded ASS subtitles
- 🔄 **Undo / Redo** — full history stack for caption edits

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand |
| Backend | Node.js, Express |
| Video | FFmpeg (via `ffmpeg-static`) |
| AI / STT | OpenAI Whisper (`openai/whisper-tiny`) via HuggingFace `transformers` |
| Python | Python 3.9+ for the local Whisper worker |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9
- `pip install transformers torch` (for local Whisper transcription)

> FFmpeg is bundled automatically via `ffmpeg-static` — no manual install needed.

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/scribemotion-ai.git
cd scribemotion-ai
```

### 2. Install dependencies

```bash
# Install root + both workspaces
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 3. Configure the server

```bash
cp server/.env.example server/.env
# Edit server/.env if needed (defaults work out of the box)
```

`server/.env.example`:

```env
PORT=5000
TRANSCRIPTION_PROVIDER=local   # or 'openai' (requires OPENAI_API_KEY)
OPENAI_API_KEY=                 # only needed if provider=openai
UPLOAD_DIR=./uploads
EXPORT_DIR=./exports
```

### 4. Install Python dependencies

```bash
pip install transformers torch
```

> The Whisper model (`openai/whisper-tiny`) is downloaded automatically on first transcription (~150 MB). It is cached in `~/.cache/huggingface/` and **never** committed to Git.

### 5. Run in development

```bash
# From the project root — starts both client and server concurrently
npm run dev
```

- **Client** → `http://localhost:5173`
- **Server** → `http://localhost:5000`

---

## 📁 Project Structure

```
scribemotion-ai/
├── client/                    # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/        # Subtitle editor, VideoPlayer, CaptionRenderer
│   │   │   ├── LandingPage/   # Hero, Features, HowItWorks sections
│   │   │   └── TranscriptionView/
│   │   └── store/             # Zustand global state
│   └── vite.config.js
│
├── server/                    # Node.js + Express backend
│   ├── controllers/           # Video upload + project management
│   ├── services/
│   │   ├── ffmpegService.js   # Audio extraction + subtitle burn-in
│   │   ├── subtitleService.js # ASS file generation
│   │   └── transcription/
│   │       ├── transcribe_local.py      # Python Whisper worker
│   │       └── localWhisperProvider.js  # Node ↔ Python bridge
│   ├── uploads/               # Runtime video uploads (git-ignored)
│   ├── exports/               # Runtime exported videos (git-ignored)
│   └── .env.example
│
├── package.json               # Root workspace — runs both client + server
└── .gitignore
```

---

## 🔄 Using OpenAI Whisper API (optional)

If you prefer cloud transcription instead of local:

```env
# server/.env
TRANSCRIPTION_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## 📦 Production Build

```bash
cd client && npm run build
```

Serve `client/dist/` with any static host (Vercel, Netlify, etc.) and deploy the Express server to Railway, Render, or Fly.io.

---

## 📄 License

MIT © 2026 ScribeMotion AI
