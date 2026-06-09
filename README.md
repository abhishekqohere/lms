# LearnHub LMS

A production-grade full-stack SaaS Learning Management System built with Next.js 15, MongoDB, and NextAuth.

## Features

- **Multi-role RBAC**: Admin, Instructor, and Student roles
- **Authentication**: Register, login, logout, forgot/reset password, profile management
- **Course Management**: Create, edit, delete, publish/unpublish courses with sections and lectures
- **Video Learning**: Progress tracking, resume playback, skip prevention, bookmarks
- **Student Features**: Browse, enroll, track progress, reviews and ratings
- **Instructor Dashboard**: Course management, student analytics, revenue overview
- **Admin Panel**: User management, instructor approval, platform statistics
- **Notifications**: Database-driven enrollment, milestone, and course notifications
- **Search & Filtering**: By title, category, level, price; sort by rating, popularity, price
- **Dark Mode**: System-aware theme switching
- **Testing**: Jest unit tests, React Testing Library, Playwright E2E

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (Auth.js v5) |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| State | TanStack Query |
| Forms | React Hook Form + Zod |
| Testing | Jest, RTL, Playwright |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Seed the database with demo data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@learnhub.com | Password1 |
| Instructor | instructor@learnhub.com | Password1 |
| Student | student@learnhub.com | Password1 |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests
npm run seed         # Seed database
npm run format       # Prettier format
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # Route handlers
│   ├── courses/           # Course listing & details
│   ├── learn/             # Video learning player
│   ├── instructor/        # Instructor dashboard
│   ├── admin/             # Admin panel
│   └── profile/           # User profile
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── courses/          # Course-specific components
│   ├── layout/           # Header, footer
│   └── providers/        # Context providers
├── lib/                   # Utilities, auth, validations
├── models/               # Mongoose models
├── types/                # TypeScript types
└── __tests__/            # Unit tests
```

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/*` | POST | Authentication |
| `/api/courses` | GET, POST | List/create courses |
| `/api/courses/[id]` | GET, PATCH, DELETE | Course CRUD |
| `/api/sections` | POST | Create sections |
| `/api/lectures` | POST | Create lectures |
| `/api/enrollments` | GET, POST | Enrollments |
| `/api/reviews` | GET, POST | Reviews |
| `/api/progress` | GET, POST | Progress tracking |
| `/api/notifications` | GET, PATCH | Notifications |
| `/api/admin/*` | GET, PATCH, DELETE | Admin operations |
| `/api/profile` | GET, PATCH | User profile |

## Database Collections

- `users` - User accounts with roles
- `courses` - Course metadata
- `sections` - Course sections
- `lectures` - Video lessons with resources
- `enrollments` - Student enrollments
- `reviews` - Course reviews and ratings
- `progress` - Learning progress tracking
- `notifications` - User notifications

## Deployment

1. Set environment variables on your hosting platform
2. Connect to MongoDB Atlas
3. Generate a secure `AUTH_SECRET`: `openssl rand -base64 32`
4. Run `npm run build && npm start`

## License

MIT
