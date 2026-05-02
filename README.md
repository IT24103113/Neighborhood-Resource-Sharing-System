# Neighborhood Resource Sharing System

A full-stack mobile platform for sharing neighborhood resources — borrow, lend, chat, and review within your community.

---

## Features

- **Authentication** — JWT-based login, registration, and protected API routes
- **Item Listings** — Create, update, delete, and browse shareable items
- **Borrow Requests** — Full request lifecycle with status tracking (incoming & outgoing)
- **Real-time Messaging** — Socket.IO powered chat between users
- **Notifications** — Instant alerts for request updates and new messages
- **Reviews** — Rate and review users after completed borrows
- **Search** — Filter and search the item catalog
- **Admin Panel** — Manage users, requests, and moderation actions
- **Media Uploads** — Image handling via Cloudinary CDN
- **Role-based Access** — Separate flows for users and admins

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) |
| Backend | Node.js + Express.js |
| Realtime | Socket.IO |
| Database | Railway.com's MongoDB service |
| Media CDN | Cloudinary |
| Hosting | Railway.com |

---

## Getting Started

> Run all commands from inside `backend` or `mobile` — not from the repo root.

### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file in `backend/` using `.env.example` as reference:

```env
PORT=5000
MONGO_URI=<mongo-url>
JWT_SECRET=<secret-here>
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

This backend uses Mongoose, so your MongoDB Atlas connection string goes directly into `MONGO_URI`. Replace the placeholder values with the Atlas username, password, cluster name, and app name from your MongoDB connection screen.

### Mobile

```bash
cd mobile
npm install
npm run start
```

Platform targets: `npm run android` · `npm run ios` · `npm run web`

> Configure API base URL via `EXPO_PUBLIC_API_BASE_URL` in your environment.

---

## API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Route | Description |
|---|---|
| `/api/auth` | Register, login |
| `/api/items` | Item CRUD |
| `/api/borrow-requests` | Request lifecycle |
| `/api/messages` | Conversations |
| `/api/notifications` | Notification feed |
| `/api/reviews` | Ratings and reviews |
| `/api/search` | Item search |
| `/api/uploads` | Media uploads |
| `/api/admin` | Admin operations |

---

## Data Seeding

```bash
cd backend
npm run seed
```

Seeds items, categories, and borrow requests from `backend/data/`.

---

## License

This project is licensed under the [MIT License](LICENSE).
