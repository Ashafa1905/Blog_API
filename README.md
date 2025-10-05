# Blog API

## Features
- JWT auth (expires in 1 hour)
- Create, edit, publish, delete blogs (owner-only)
- Public listing & single blog read (increments read_count)
- Pagination, search, filter, sort
- Reading time auto-calculated (minutes)

## Run locally
1. copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm run dev`

## Tests
`npm test`

## Deploy
- Use MongoDB Atlas for production `MONGO_URI`.
- Deploy to Heroku/Render — instructions are in DEPLOY.md (see below).
