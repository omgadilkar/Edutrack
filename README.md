# EduTrack — Classroom & Student Management Portal

A full-stack classroom management app with role-based access for **Admins**, **Teachers**, and **Students**.

## Features
- **Admin**: create/manage users (teachers & students), create classes, assign teachers, view overview stats
- **Teacher**: view assigned classes, take daily attendance, enter/view grades per class
- **Student**: view own attendance history and grades
- JWT-based authentication, passwords hashed with bcrypt
- SQLite database (zero-config, file-based) — seeded with demo data on first run

## Tech Stack
- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Frontend**: Single-page vanilla JS/HTML app (no build step required), served statically by the backend
- **Database**: SQLite (`backend/db/edutrack.sqlite`, auto-created)

## Project Structure
```
edutrack/
├── backend/
│   ├── db/
│   │   ├── schema.sql       # table definitions
│   │   └── init.js          # DB connection + auto-seed
│   ├── middleware/
│   │   └── auth.js          # JWT auth + role guard
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── classes.js
│   │   ├── attendance.js
│   │   └── grades.js
│   ├── server.js
│   └── package.json
├── frontend/
│   └── index.html           # the entire frontend app
└── README.md
```

## Setup

```bash
cd backend
npm install
npm start
```

The server starts on **http://localhost:4000** and serves the frontend at the same address.
On first run, it auto-creates and seeds the SQLite database with demo accounts.

## Demo Logins

| Role    | Email                  | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@edutrack.dev      | admin123     |
| Teacher | sharma@edutrack.dev     | teacher123   |
| Teacher | rao@edutrack.dev        | teacher123   |
| Student | aarav@edutrack.dev      | student123   |
| Student | diya@edutrack.dev       | student123   |

(5 sample students, 2 classes with enrollments are pre-seeded.)

## Database Schema (summary)

- **users**: id, name, email, password_hash, role (`admin` / `teacher` / `student`)
- **classes**: id, name, subject, teacher_id, schedule
- **enrollments**: class_id ↔ student_id (many-to-many)
- **attendance**: class_id, student_id, date, status (`present`/`absent`/`late`/`excused`) — unique per class+student+date
- **grades**: class_id, student_id, assignment_name, score, max_score, date

## API Overview

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

- `POST /api/auth/login` — log in, returns JWT
- `GET /api/auth/me` — current user
- `GET/POST/DELETE /api/users` — admin manages users
- `GET/POST /api/classes` — list/create classes; `GET /api/classes/:id/students`, `POST /api/classes/:id/enroll`
- `GET/POST /api/attendance`, `GET /api/attendance/mine` (student)
- `GET/POST /api/grades`, `GET /api/grades/mine` (student)

## Next Steps / Ideas to Extend
- Parent role + parent-student linking
- Email notifications for absences / low grades
- Reporting/analytics dashboard (attendance trends, grade distributions)
- File uploads for assignments
- Password reset flow
- Deploy with a production JWT secret via environment variable (`JWT_SECRET`)
