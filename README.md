# iinpaay Amira — Voice-First Banking Demo

A frontend-only proof of concept demonstrating how non-technical users can interact with a fintech platform entirely through voice, in English, Hausa, Yoruba, or Igbo.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3001

## Features

- Voice-guided onboarding (registration and login)
- 4 languages: English, Hausa, Yoruba, Igbo
- Add Money simulation
- Send Money with Protected Payment option
- Recipient autocomplete from local users
- Project creation and management
- Transaction history with running totals
- Full manual fallback — voice is never mandatory
- PIN always typed, never spoken
- All data stored in localStorage — no backend

## Voice Technology

- **Speech synthesis** (Amira speaking): Web Speech API `SpeechSynthesis`
- **Speech recognition** (user speaking): Web Speech API `SpeechRecognition`
- Works best in Chrome/Edge on desktop and Android Chrome

## Architecture

Single-page app with Zustand state management. No routing library — page is a store value. No backend calls. All persistence is `localStorage`.
