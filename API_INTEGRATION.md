# API Integration Documentation

## Overview

The web app has been updated to use the real backend API instead of mock data. All services now connect to the backend at `http://localhost:3000` (configurable via `VITE_API_BASE` env var).

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE=http://localhost:3000
```

For production, update with your actual API URL:
```env
VITE_API_BASE=https://api.example.com
```

## API Endpoints

### Authentication

- **POST /auth/login** - Login
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id, name, email, avatar } }`

- **POST /auth/logout** - Logout
  - Response: `{ success: boolean }`

### User Profile

- **GET /user** - Get current user profile
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ id, name, email, avatar, streak?, bookmarks?, badges? }`

### Bookmarks

- **GET /bookmarks** - Get user bookmarks
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ data: { bookmarks: string[] } }`

- **PUT /bookmarks** - Update bookmarks
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ bookmarks: string[] }`
  - Response: `{ data: { bookmarks: string[] } }`

### Streak

- **GET /streak** - Get user streak info
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ current: number, best: number, lastUpdated: string }`

### Badges

- **GET /badges** - Get user badges
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ data: Badge[] }`

### Flashcards (Public)

- **GET /flashcards** - List flashcards
  - Query params: `page`, `pageSize`, `topic`, `level`
  - Response: 
    ```json
    {
      "data": [Flashcard[]],
      "meta": {
        "page": number,
        "pageSize": number,
        "total": number,
        "totalPages": number,
        "topics": string[],
        "levels": string[]
      }
    }
    ```

- **GET /topics** - List all topics
  - Response: `{ data: { id: string, label: string }[] }`

- **GET /levels** - List all levels
  - Response: `{ data: { id: string, label: string }[] }`

## Data Models

### Flashcard

```typescript
interface Flashcard {
  id: string
  topic: string
  level: string
  is_premium: boolean
  content: {
    hanzi: string
    pinyin: string
    english_phonetic?: string
    image_url?: string
    audio: {
      cn: string
      en: string
      vi: string
    }
    meanings: {
      en: string
      vi: string
    }
    example_sentence?: {
      hanzi: string
      pinyin: string
      meaning_vi: string
    }
  }
}
```

### User

```typescript
interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Streak {
  current: number
  best: number
  lastUpdated: string
}

interface Badge {
  id: string
  name: string
  icon: string
  description: string
}
```

## Authentication

All protected endpoints require the `Authorization` header with a Bearer token:

```
Authorization: Bearer <token>
```

The token is automatically included in all requests via axios interceptors defined in [src/services/apiClient.ts](src/services/apiClient.ts).

### Token Management

- Token is stored in `localStorage` after login
- If a 401 response is received, the token is cleared and user redirected to login
- Logout clears the token from `localStorage`

## Service Files

### apiClient.ts

Central axios instance with:
- Base URL configuration
- Request interceptor for auto-attaching auth token
- Response interceptor for handling 401 errors

### authService.ts

- `login(email, password)` - Login user
- `logout()` - Logout user

### userService.ts

- `fetchUser()` - Get user profile
- `fetchBookmarks()` - Get bookmarks
- `fetchStreak()` - Get streak info
- `fetchBadges()` - Get badges
- `updateBookmarks(bookmarks)` - Update bookmarks

### flashcardService.ts

- `fetchFlashcards(params)` - Get flashcards with pagination and filtering
- `fetchTopics()` - Get available topics
- `fetchLevels()` - Get available levels

## Error Handling

All services throw axios errors on failure. The store handles errors and can display them to the user. For 401 errors, the apiClient automatically redirects to login.

## Testing the Integration

1. Start the backend server on port 3000 (or configure `VITE_API_BASE`)
2. Run the frontend: `npm run dev`
3. Login with valid credentials from the backend
4. Test flashcard fetching, bookmarks, and profile operations

## Migration Notes

- Removed all mock API file fallbacks (public/api/*)
- Removed mock data json files (src/data/*-mock.json) as they're no longer needed
- All API calls now directly hit the backend
- Response formats must match the specifications above
