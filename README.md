# GameVault - Backend

REST API for **GameVault**, a game review and backlog tracker. Users can browse games, write reviews, keep a personal backlog (Wishlist, Playing, Completed) and see statistics on a dashboard. Admins manage the game catalogue.

Built for the **ITS2020 Rapid Application Development** final coursework (individual project).

- **Frontend repository:** `https://github.com/Neon2598-bit/RAD_Coursework_Gaming_Vault_Frontend.git`
- **Live API:** `https://rad-coursework-gaming-vault-backend.onrender.com/` (health check: `https://rad-coursework-gaming-vault-backend.onrender.com/api/health`)
- **Live frontend:** `https://rad-coursework-gaming-vault-fronten.vercel.app/`

> The free Render plan puts the service to sleep after 15 minutes without traffic, so the first request after a pause can take up to a minute.

## Technologies

| Area | Tools |
|---|---|
| Runtime and framework | Node.js, Express.js (v4) |
| Language | TypeScript (strict mode) |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT (access and refresh tokens), bcryptjs |
| Other | dotenv, cors |
| Hosting | Render (API), MongoDB Atlas (database) |

## Features

- **Authentication and security:** register, login, logout, refresh token, bcryptjs password hashing, JWT access token (15 min) and refresh token (7 days), role-based authorization (`user`, `admin`), secrets in `.env`.
- **Games:** public list with search, genre and platform filters and pagination. Admins can create, edit, soft delete and restore games.
- **Reviews:** one review per user per game (rating 1-5 and optional comment). Authors edit and delete their own reviews, admins can delete any review. Each game shows its average rating.
- **Backlog:** each user keeps a private list of games with a status (`wishlist`, `playing`, `completed`).
- **Dashboard (advanced feature):** analytics built with MongoDB aggregation: games per status, review count and average rating, and top genres.
- **Validation and errors:** schema validation, input checks and one consistent JSON error format with proper HTTP status codes.

## Data models

| Model | Main fields | Relationships |
|---|---|---|
| **User** | name, email (unique), password (hashed), role | has many Reviews and BacklogItems |
| **Game** | title, genre, platform, releaseYear, description, coverImage, isDeleted | has many Reviews |
| **Review** | rating, comment | belongs to a User and a Game (unique per user and game) |
| **BacklogItem** | status | belongs to a User and a Game (unique per user and game) |

## Project structure

```
src/
  config/        environment variables and database connection
  models/        Mongoose models (User, Game, Review, BacklogItem)
  controllers/   request logic for each feature
  routes/        URL definitions
  middleware/    authentication, authorization and error handling
  utils/         token generation, async handler, id validation
  seed/          sample data script
  app.ts         Express app setup
  server.ts      starts the server
```

## Setup and run locally

**Requirements:** Node.js 20 or newer, and a free MongoDB Atlas cluster.

1. Clone the repository and install the packages:
   ```bash
   git clone <this repository URL>
   cd <repository folder>
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values (see the table below).
3. (Optional) Load 10 sample games:
   ```bash
   npm run seed:games
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5000/api/health. You should see `GameVault API is running`.

**Scripts**

| Command | What it does |
|---|---|
| `npm run dev` | Starts the server with automatic restart |
| `npm run build` | Compiles TypeScript into `dist/` |
| `npm start` | Runs the compiled server (`dist/server.js`) |
| `npm run seed:games` | Inserts sample games if the collection is empty |

**Environment variables**

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (default 5000, set automatically on Render) |
| `MONGO_URI` | MongoDB Atlas connection string, including the database name |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS, separated by commas |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | A different secret for refresh tokens |
| `JWT_ACCESS_EXPIRES` | Access token lifetime (default `15m`) |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime (default `7d`) |

**Creating an admin:** registration always creates a normal `user`. To make an admin, register an account, then in MongoDB Atlas open the `users` collection and change that user's `role` to `admin`. Log in again to get a token with the new role.

## API endpoints

Protected routes need the header `Authorization: Bearer <accessToken>`. All responses are JSON with a `success` field.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create an account (name, email, password) |
| POST | `/api/auth/login` | Public | Log in, returns access and refresh tokens |
| POST | `/api/auth/refresh` | Public | Exchange a refresh token for a new access token |
| POST | `/api/auth/logout` | User | Invalidate the refresh token |
| GET | `/api/auth/me` | User | Current user |

### Games
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/games` | Public | List games. Query: `search`, `genre`, `platform`, `page`, `limit` |
| GET | `/api/games/:id` | Public | One game |
| POST | `/api/games` | Admin | Create a game |
| PUT | `/api/games/:id` | Admin | Update a game |
| DELETE | `/api/games/:id` | Admin | Soft delete a game |
| GET | `/api/games/deleted` | Admin | List soft-deleted games |
| PUT | `/api/games/:id/restore` | Admin | Restore a soft-deleted game |

### Reviews
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/games/:gameId/reviews` | Public | Reviews of a game with its average rating |
| POST | `/api/games/:gameId/reviews` | User | Add my review (one per game) |
| GET | `/api/reviews/my` | User | My reviews |
| PUT | `/api/reviews/:id` | Author | Edit my review |
| DELETE | `/api/reviews/:id` | Author or admin | Delete a review |

### Backlog
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/backlog` | User | My backlog. Optional query: `status` |
| POST | `/api/backlog` | User | Add a game. Body: `gameId`, optional `status` |
| PUT | `/api/backlog/:id` | User | Change status |
| DELETE | `/api/backlog/:id` | User | Remove from my backlog |

### Dashboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard` | User | Games per status, review statistics and top genres |

### Other
| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |

## Security notes

- Passwords are hashed with bcryptjs and never returned by the API.
- Access tokens are short-lived. The refresh token is also stored in the database, so logging out invalidates it.
- Role is never taken from the request body, so users cannot make themselves admin.
- Request bodies are limited to known fields, ids and filters are validated, and search text is escaped to prevent injection.
- Secrets live in environment variables. `.env` is listed in `.gitignore`.

