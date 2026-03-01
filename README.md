# 🚕 Cab Connect — College Ride Sharing Platform

Cab Connect is a secure, real-time ride-sharing platform built specifically for college students to coordinate shared cab rides (e.g., airport travel).  
It replaces messy WhatsApp groups with a **structured, secure, and moderated system**.
 
---

## ✨ Key Features 

### 👤 Authentication & Security
- College email–restricted OTP login
- JWT-based session management
- No password storage
- Rate-limited OTP requests
- Role-based access control (RBAC)

### 🚗 Ride Management
- Create, join, and leave rides
- Max 4 participants per ride
- Creator auto-joins ride
- Ride auto-expires after travel time
- Expired rides cleaned automatically
- Creator can **lock a ride** to prevent new users from joining (useful for luggage/comfort)
- Ride can be locked only when it has **at least 2 participants**
- Locked rides remain active but are **not joinable** until unlocked
- Lock/unlock updates propagate in **real-time via Socket.IO**
- Locking is **race-condition safe** (atomic MongoDB update)

### ⭐ Smart Ride Matchmaking (New)
- New Join Flow: users enter destination + preferred departure time
- Backend suggests rides in a strict window: **±15 minutes**
- Only `open` rides suggested
- Sorted by: **closest departure time + seats availability**
- Suggestions cached using Redis
- Locked rides are **automatically excluded** from recommendations/suggestions

### 💬 Real-Time Ride Chat
- Socket.IO powered chat per ride
- Only ride participants can chat
- Messages stored in database
- Chat auto-disabled if ride is deleted/expired

### 🛡️ Admin Moderation System
- Secure admin escalation (OTP + admin password)
- Admin can:
  - View all rides
  - Delete any ride
  - Temporarily ban users (7 days)
  - Permanently ban users after 3 strikes
  - Unban temporarily banned users
- Banned users:
  - ❌ Cannot chat
  - ❌ Cannot create rides
  - ✅ Can still join rides

### 🔔 Notifications
- Persistent notifications stored in DB
- Real-time socket notifications
- Used for admin actions (ride deletion, bans)

### 🚨 User Reporting & Moderation
- Ride-scoped user reporting system
- Structured report submission (no free-text abuse)
- One report per user per ride per target (anti-spam)
- Context-aware validation (only ride participants can report)
- Admin review pipeline with report statuses

### ⚡ Redis Integration (Performance & Scalability)   
  Redis is used for:
- OTP storage with TTL (5 min expiry)
- OTP cooldown tracking + retry attempts
- Caching heavy ride APIs (ride list / ride details / ride chat messages)
- Cache invalidation on ride updates (create/join/leave/delete)
-  Caching ride suggestions API (matchmaking)
-  Cache invalidation also triggers on **ride lock/unlock** to prevent stale UI state

### 🔒 Ride Locking (New)
- Ride creator can lock/unlock rides to stop further joining even if seats are available
- Lock requires minimum 2 participants
- Lock state displayed on ride cards + enforced in backend join logic
- Fully synced across clients using Socket.IO events

### 🧹 Automatic Ride Expiry (BullMQ + Redis)
- Ride expiry handled via **BullMQ delayed jobs**
- Each ride schedules an expiry job at creation time
- Jobs persist in Redis (restart-safe)
- On expiry:
  - ride marked `expired`
  - realtime socket updates sent
  - caches invalidated


---

## 🏗️ System Architecture

```bash
Client (React)
|
| REST APIs (JWT Auth)
|
Express.js Backend
├── Auth Service (OTP + Admin Escalation)
├── Ride Service
├── Admin Moderation Service
├── Notification Service
├── Cleanup Jobs (Cron)
└── Socket.IO (Chat + Realtime Events)
|
MongoDB Atlas
Redis (OTP + Cache)
```
---

---

## 📂 Project Structure
```bash
Cab_Connect/
│
├── Cab_Connect-Frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── contexts/
│ │ └── services/
│ └── package.json
│
├── Cab_Connect-Backend/
│ ├── models/
│ ├── controllers/
│ ├── routes/
│ ├── middleware/
│ ├── utils/
│ ├── jobs/
│ ├── server.js
│ └── package.json
│
└── README.md
```
---

## 🔐 Authentication Flow

### Normal User Login
### Email → OTP → JWT (role: user)
### Admin Login (Privilege Escalation)
### Email → OTP → Admin Password → role upgraded to admin
  - Admin password stored only in `.env`
  - No hardcoded emails
  - No magic tokens
---

## 🧑‍⚖️ RBAC (Role-Based Access Control)
---------------------------------------------
| Role  | Permissions                       |
|-------|-----------------------------------|
| User  | Create / Join rides, Chat         |
| Admin | All user permissions + moderation |
---------------------------------------------

RBAC is enforced using centralized middleware.

---

## 🚫 Ban Policy Logic

### Temporary Ban
- Duration: **7 days**
- Triggered by admin
- Blocks:
  - Chat
  - Ride creation

### Permanent Ban
- Triggered after **3 bans**
- No auto-unban
- Still allowed:
  - Joining rides

>**Note:** Banned users are restricted from chatting and creating rides but can still join rides (policy decision).


> **Note:** The moderation system uses a strike-based enforcement model where repeated violations lead to permanent bans.

---

## 🧹 Background Jobs

- **BullMQ worker** automatically expires rides at departure time
- Cleans ride data (messages, caches)
- Notifies connected users in real time via Socket.IO
- Optional cron fallback can be kept for legacy cleanup


---

## 📦 Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- Socket.IO
- JWT
- bcrypt
- express-rate-limit
- Redis (OTP + caching)

### Frontend
- Typescript
- Tailwind CSS
- Context API
- Bun
---

## 🚀 Local Setup

### Clone Repository
```bash
git clone https://github.com/your-username/cab_connect.git
cd cab_connect
```
### Backend Setup
```bash
cd Cab_Connect/Cab-Connect-Backend
npm install
```
### Frontend Setup
```bash
cd Cab_Connect/Cab-Connect-Frontend
npm install
```


### Create ```.env``` file:
```
Input your values :)
Working on Test Keys to Provide with Rate Limits
```

## Docker and Redis Setup
```bash
Redis Setup (Docker)
docker run -d --name redis -p 6379:6379 redis
```
### Test Redis
**Redis is required for OTP storage, caching, and BullMQ queues.**
```bash
docker exec -it redis redis-cli ping
# Expected: PONG
```
### Run: 
```
npm run dev
```

## 🧪 Testing

This project includes unit, integration, and advanced concurrency tests to ensure backend reliability and race-condition safety.

### 📦 Test Stack
- **Vitest** – Test runner
- **Supertest** – API endpoint testing
- **MongoDB (local)** – Isolated test database

---

### ⚙️ Test Environment Setup

1. Make sure MongoDB is running locally.

2. Create a test database (auto-created on first run):
   ```mongodb://127.0.0.1:27017/cabconnect_test```
3. Add test variables to your `.env` (or `.env.test` if separated):

    ```env```
    ```JWT_ACCESS_SECRET=testsecretkey```
4. Run All Tests

  ```npx vitest run```



## 📚 API Documentation (Swagger)

This backend provides interactive API documentation using **Swagger UI**.

### Start Server
```bash
npm install
node src/server.js
visit localhost:5000/docs
```

## 👨‍💻 Author

**Divyansh Garg**  
Built as a real-world, security-focused system for college students.

