# 単語 (Tango) - Japanese-Spanish Flashcard PWA

A progressive web app for creating and studying Japanese vocabulary sets with Spanish translations using Claude Vision for intelligent vocabulary extraction.

## Features

- 📸 **Claude Vision Integration**: Upload Japanese vocabulary images and automatically extract content
- 📚 **Flashcard Study**: Interactive swipe-based flashcard interface (right = known, left = to review)
- 📊 **Progress Tracking**: Track your learning progress across multiple vocabulary sets
- 💾 **Offline Support**: Full PWA support with service worker for offline functionality
- 📱 **Mobile-First**: Designed for mobile devices with touch optimization
- 🎨 **Beautiful UI**: Pixel-perfect design with Tailwind CSS and Radix UI components
- 🌐 **PWA Ready**: Installable on phones and desktop devices

## Tech Stack

- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI
- **AI**: Claude Haiku with Vision capabilities (via Anthropic SDK)
- **Storage**: Browser localStorage for sets and progress
- **PWA**: Service Worker + Web Manifest

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env.local` file with your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to access the app.

## Routes

- `/` - Splash/Welcome screen
- `/inicio` - Home screen with vocabulary sets
- `/crear` - Create new vocabulary set from image upload
- `/progreso` - Progress tracking dashboard
- `/estudiar/[id]` - Study flashcards for a set

## Data Structure

Vocabulary sets are stored in `localStorage` with the following structure:

```typescript
interface StoredSet {
  id: string;
  name: string;
  cards: Array<{
    kana: string;
    kanji: string;
    spanish: string;
    example_usage: string;
  }>;
  createdAt: string;
  lastStudied: string | null;
  progress: Array<{
    cardId: string;
    known: boolean;
  }>;
}
```

## How to Use

1. **Create a Set**: Navigate to "Crear" and upload an image of vocabulary
2. **Study**: Use the flashcard interface - right swipe to mark as known, left to mark for review
3. **Track Progress**: View your progress in the "Progreso" tab
4. **Return to Sets**: Go back to "Inicio" to switch between sets

## Swipe Mechanics

- **Right Swipe (Green)**: Mark card as known
- **Left Swipe (Red)**: Mark for review
- **Tap**: Flip the card to see translation
- **Arrow Buttons**: Navigate without swiping
- **Shuffle**: Randomize card order

## Building for Production

```bash
npm run build
npm start
```

## PWA Installation

The app is PWA-ready and can be installed on:
- iOS Safari (add to home screen)
- Android Chrome (install app prompt)
- Desktop browsers (install app button)

## API Reference

### POST /api/extract-vocab

Extract vocabulary from an image using Claude Vision.

**Request:**
```json
{
  "image": "base64_encoded_image",
  "mediaType": "image/jpeg"
}
```

**Response:**
```json
{
  "vocabulary": [
    {
      "kana": "あきらめる",
      "kanji": "諦める",
      "spanish": "renunciar",
      "example_usage": "彼は諦めなかった。"
    }
  ]
}
```

## Project Structure

```
flashcard-app/
├── app/
│   ├── api/extract-vocab/    # Claude Vision API endpoint
│   ├── estudiar/[id]/        # Study screen
│   ├── crear/                # Create new set
│   ├── inicio/               # Home screen
│   ├── progreso/             # Progress dashboard
│   ├── layout.tsx            # Root layout with fonts and PWA setup
│   ├── page.tsx              # Splash screen
│   └── globals.css           # Global styles
├── components/
│   ├── splash-screen.tsx
│   ├── home-screen.tsx
│   ├── crear-screen.tsx
│   ├── flashcard.tsx
│   ├── progreso-screen.tsx
│   └── ui/                   # Radix UI component library
├── lib/
│   ├── storage.ts            # localStorage utilities
│   └── utils.ts              # Helper functions
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── assets/               # Images and icons
└── styles/
    └── globals.css           # Tailwind v4 configuration
```

## Contributing

This is a personal learning project. Feel free to fork and customize!

## License

MIT

---

Built with ❤️ using Claude, v0, and Next.js
