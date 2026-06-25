# Smart Bus Tracking System

A full-stack university/campus bus tracking application. Students track buses live on Google Maps, browse routes and schedules, and register for the shuttle service. Drivers broadcast GPS from their browser. Built as a Problem-Based Learning (PBL) project with sample routes around **Dehradun, India** (Gehu Bus Stand area).

---

## Features

| Feature | Description |
|---------|-------------|
| **Live GPS Tracking** | Real-time bus positions on Google Maps with auto-refresh |
| **Route Management** | 10 routes, 50 stops with expandable timeline view |
| **Schedules** | Departure/arrival times filtered by route and day |
| **Student Registration** | Register for bus service with route and stop selection |
| **Driver Dashboard** | Browser GPS tracking with live map and path visualization |
| **Notifications** | Alerts when a bus is approaching a student's stop |
| **Authentication** | Session-based login for students and drivers |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, React Router 7, Vite 7, Axios, Google Maps API, Font Awesome |
| **Backend** | Python Flask, Flask-Session, Flask-CORS |
| **Database** | MongoDB (PyMongo) 
| **Auth** | Session cookies + SHA256 password hashing |

---

## Project Structure

```
Smart-Bus-Tracking-System/
├── backend/                        # Flask REST API
│   ├── app.py                      # Main API server (all routes)
│   ├── db.py                       # MongoDB connection & helpers
│   ├── seed_mongo.py                 # Seed wrapper
│   ├── notification_service.py     # Background notification checker
│   ├── gps_simulator.py            # Fake GPS for testing
│   ├── requirements.txt
│   └── .env                        # MONGODB_URI, Flask config (create from .env.example)
│
├── bus-tracker-react/              # React frontend
│   ├── src/
│   │   ├── pages/                  # Home, Tracking, Routes, Schedule, Register, Profile
│   │   ├── components/             # Navbar, AuthModal, GoogleMap, DriverDashboard, etc.
│   │   ├── contexts/               # AuthContext
│   │   ├── services/               # api.js — all backend calls
│   │   ├── hooks/                  # useGoogleMaps.js
│   │   └── config/                 # config.js — API URL, Maps key, map center
│   ├── vite.config.js              # Dev server + /api proxy to Flask
│   └── package.json
│
├── database/
│   ├── schema.sql                  # Original MySQL schema + sample data
│   ├── add_notifications_system.sql
│   └── MONGODB_DATABASE_OVERVIEW.txt  # Full MongoDB architecture doc
│
├── START_HERE.md                   # Quick start guide
└── README.md                       # This file
```

---

## Architecture

```
┌─────────────────────┐
│  React Frontend     │  http://localhost:5173
│  (Vite + React)     │
└─────────┬───────────┘
          │  /api/*  (Vite proxy → same origin, no CORS issues)
          ▼
┌─────────────────────┐
│  Flask Backend      │  http://127.0.0.1:5000
│  (REST API)         │
└─────────┬───────────┘
          │  PyMongo (MONGODB_URI from .env)
          ▼
┌─────────────────────┐
│  MongoDB            │  Database: smartbus
│  (local or Atlas)   │  Collections: buses, routes, stops, students,
└─────────────────────┘  tracking, user_accounts, drivers, notifications, counters
```

---

## Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.9+
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
- **Google Maps API key** — [Google Cloud Console](https://console.cloud.google.com/) → enable Maps JavaScript API

---

## Setup Guide

### 1. Clone and enter the project

```bash
cd Smart-Bus-Tracking-System
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (copy from `.env.example`):

```env
# MongoDB — local
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=smartbus

# MongoDB Atlas example:
# MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority
# MONGODB_DB_NAME=smartbus

# Dev-only if SSL fails on Windows:
# MONGODB_TLS_INSECURE=true

# Flask
FLASK_SECRET_KEY=your_secret_key_here
FLASK_DEBUG=True
API_HOST=0.0.0.0
API_PORT=5000

# Session
SESSION_TYPE=filesystem
SESSION_PERMANENT=True
SESSION_LIFETIME_DAYS=7
SESSION_COOKIE_HTTPONLY=True
```

Start the API:

```bash
python app.py
```

You should see: `Running on http://127.0.0.1:5000`

### 3. Frontend setup

Open a **second terminal**:

```bash
cd bus-tracker-react
npm install
```

Add your Google Maps API key in `bus-tracker-react/src/config/config.js`:

```javascript
GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
```

Optionally set map center to your location:

```javascript
MAP_DEFAULT_CENTER: {
    lat: 30.273378372192383,
    lng: 77.99981689453125
},
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:5173**

### 4. Test login

| Username | Password | Role |
|----------|----------|------|
| `student1` | `password123` | Student |
| `driver1` | `password123` | Driver |
| `admin` | `admin123` | Admin |

---

## MongoDB Database

The app uses **MongoDB** instead of MySQL. SQL tables map to MongoDB collections:

| SQL Table | MongoDB Collection | Key Field |
|-----------|-------------------|-----------|
| BUS | `buses` | B_ID |
| ROUTE | `routes` | R_ID |
| STOP | `stops` | STOP_ID |
| STUDENT | `students` | S_ID |
| SCHEDULE | `schedules` | SCH_ID |
| TRACKING | `tracking` | T_ID |
| USER_ACCOUNTS | `user_accounts` | USER_ID |
| DRIVER | `drivers` | DRIVER_ID |
| NOTIFICATION | `notifications` | N_ID |

Relationships use **integer reference fields** (e.g. `R_ID`, `B_ID`) — same as SQL foreign keys, but enforced in application code rather than by the database.

Auto-increment IDs are handled by a `counters` collection via `get_next_id()` in `backend/db.py`.

**Full database documentation:** [database/MONGODB_DATABASE_OVERVIEW.txt](database/MONGODB_DATABASE_OVERVIEW.txt)


Reads `database/schema.sql` and loads all sample data into MongoDB.

---

## API Endpoints

Base URL (via proxy): `http://localhost:5173/api`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register student or driver |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/status` | Check session |

### Buses & Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/buses` | All buses |
| GET | `/buses/route/:route_id` | Buses on a route |
| GET | `/bus-location/:bus_id` | Latest GPS for one bus |
| GET | `/all-bus-locations` | Latest GPS for all buses |
| POST | `/update-location` | Driver GPS update (auth required) |
| POST | `/track/:bus_id` | Simulate GPS (testing) |
| GET | `/tracking-history/:bus_id` | Last 10 location records |

### Routes & Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes` | All routes |
| GET | `/stops/:route_id` | Stops for a route |
| GET | `/schedule/:route_id` | Schedule for a route |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/student-register` | Register for bus service |
| GET | `/student/details/:email` | Student profile + route/stop info |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/:student_id` | List notifications |
| PUT | `/notifications/:id/read` | Mark one as read |
| PUT | `/notifications/student/:id/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |
| POST | `/notifications/create` | Create notification (testing) |

---

## User Roles

### Student

- Browse routes and stops
- View schedules (after login)
- Track buses on the map (after login)
- Register for bus service
- View profile and registration details
- Receive proximity notifications

### Driver

- Login → Profile page shows **Driver Dashboard**
- Select route and assigned bus
- Start/stop browser GPS tracking
- Location sent to backend every 5 seconds
- Live map with path visualization

---

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → enable **Maps JavaScript API**
3. Create an API key under **Credentials**
4. Paste the key in `bus-tracker-react/src/config/config.js`:

```javascript
GOOGLE_MAPS_API_KEY: 'your_key_here',
```

5. (Recommended) Restrict the key to Maps JavaScript API and your domain (`http://localhost:5173/*`)

Maps are used on the **Tracking** page and **Driver Dashboard**.

---

## Optional: GPS Simulator

Simulate bus movement without a real driver:

```bash
# Terminal 3 — backend must be running
cd backend
python gps_simulator.py
```

Or on Windows: double-click `start_gps_simulator.bat`

---

## Optional: Notification Service

Run the background service that alerts students when their bus is 2 stops away:

```bash
cd backend
python notification_service.py
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Database name | `smartbus` |
| `MONGODB_TLS_INSECURE` | Skip SSL verify (dev only) | `true` |
| `FLASK_SECRET_KEY` | Session encryption key | random string |
| `FLASK_DEBUG` | Debug mode | `True` |
| `API_PORT` | Backend port | `5000` |

### Frontend (`bus-tracker-react/src/config/config.js`)

| Setting | Description |
|---------|-------------|
| `API_BASE_URL` | Backend URL (`/api` uses Vite proxy) |
| `GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `MAP_DEFAULT_CENTER` | Default map lat/lng |
| `AUTO_REFRESH_INTERVAL` | Map refresh interval (ms) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MongoDB connection failed | Check `MONGODB_URI` in `backend/.env`; ensure MongoDB is running or Atlas IP is whitelisted |
| SSL certificate error (Atlas) | Sync Windows date/time; or set `MONGODB_TLS_INSECURE=true` in dev |
| CORS / login not persisting | Use frontend at `localhost:5173` (Vite proxy handles `/api`) |
| Maps not loading | Add valid `GOOGLE_MAPS_API_KEY` in `config.js`; enable Maps JavaScript API |
| Empty database | Run `python import_sql_to_mongo.py` from `backend/` |
| Driver GPS not working | Allow location permission in browser; use HTTPS in production |

---

## Scripts Reference

### Backend

```bash
python app.py                    # Start API server
python import_sql_to_mongo.py    # Seed MongoDB from schema.sql
python seed_mongo.py             # Same as above
python gps_simulator.py          # Simulate bus GPS
python notification_service.py   # Run notification checker
```

### Frontend

```bash
npm run dev      # Development server (port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## Documentation Files

| File | Contents |
|------|----------|
| [README.md](README.md) | This file — full project overview |
| [START_HERE.md](START_HERE.md) | Quick 4-step setup |
| [database/MONGODB_DATABASE_OVERVIEW.txt](database/MONGODB_DATABASE_OVERVIEW.txt) | MongoDB collections, relationships, data flows |
| [bus-tracker-react/README.md](bus-tracker-react/README.md) | Frontend-specific docs |
| [database/schema.sql](database/schema.sql) | Original SQL schema + sample data |

---

## License

This project is part of the Smart Bus Tracker PBL system.

---

**Built with** React · Flask · MongoDB · Google Maps

**Version:** 2.0.0 (MongoDB migration)
