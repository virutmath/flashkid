Flashcard Kids - Vite + Vue 3 + Pinia + Vant + PWA

Phases:
- Phase 1: Project setup and data store
- Phase 2: Flashcard component and UI
- Phase 3: Game logic
- Phase 4: Print and PWA tweaks

Run:
- npm install
- npm run dev

Mock API (served from /public/api for now):
- GET /api/flashcards.json → { data: Flashcard[], meta: { total, topics[], levels[] } }
- GET /api/topics.json → { data: [{ id, label, count }], meta }
- GET /api/levels.json → { data: [{ id, label, count }], meta }
Use VITE_API_BASE to point to a real API later; the service falls back to local sample data if unreachable.
