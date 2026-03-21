# seiftype

A feature-rich typing practice app built with React + Vite and Supabase.

## Features

- Real-time typing engine with character-by-character validation
- Multiple content modes: random words, quotes, code snippets, custom text
- User accounts with public profiles at `/u/[username]`
- Stats & progression: XP/levels, WPM/accuracy charts, keyboard heatmap, weak bigrams
- Daily challenges with global leaderboard and streak tracking
- Ranked 1v1 multiplayer with ELO rating system
- 20+ achievements/badges
- 8 built-in themes + custom theme creator
- Font, caret style, and sound customization

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts, Zustand
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions)

## Setup

1. Clone and install:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the Supabase migration:
   ```bash
   supabase db push
   ```

5. Deploy Edge Functions:
   ```bash
   supabase functions deploy elo-update
   supabase functions deploy daily-challenge
   ```

6. Start the dev server:
   ```bash
   npm run dev
   ```

## Deployment

Build for production:
```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host. Set the environment variables on your hosting platform.

## Project Structure

```
src/
  components/   # UI components (typing, layout, auth, stats, profile, daily, race, ui)
  data/         # Static data (words, achievements, themes)
  hooks/        # Custom React hooks (typing engine, sound, realtime, achievements)
  lib/          # Core libraries (supabase client, elo, stats)
  pages/        # Route pages
  stores/       # Zustand state stores
supabase/
  functions/    # Edge Functions (elo-update, daily-challenge)
  migrations/   # Database schema SQL
```

## License

MIT
