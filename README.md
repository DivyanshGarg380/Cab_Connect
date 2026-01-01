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
```
---

## 🛠 Tech Stack

### Frontend
- React
- Tailwind CSS
- Context API
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication
- Cron Jobs for cleanup

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

---

## 🧹 Background Jobs

- Automatically deletes expired rides
- Cleans associated messages
- Notifies connected users in real time

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

**Frontend**
- React (planned / integrated separately)

---

## 📂 Project Structure
```bash
src/
├── app.js
├── server.js
├── routes/
│ ├── auth.routes.js
│ ├── ride.routes.js
│ ├── admin.route.js
│ ├── notification.route.js
├── models/
│ ├── User.model.js
│ ├── Ride.model.js
│ ├── Message.model.js
│ ├── Notification.model.js
│ ├── Otp.model.js
├── middleware/
│ ├── auth.middleware.js
│ ├── admin.middleware.js
│ ├── ban.middleware.js
│ ├── rateLimit.middleware.js
├── sockets/
│ └── chat.socket.js
├── jobs/
│ └── deleteExpiredRides.job.js
├── utils/
│ ├── generateOtp.js
│ └── validate.js
```

## 🚀 Local Setup

### Clone Repository
```bash
git clone https://github.com/your-username/cab_connect.git
cd cab_connect
```
### Backend Setup
```bash
cd Cab_Connect/Cab_Connect-Backend
npm install
```
### Frontend Setup
```bash
cd Cab_Connect/Cab_Connect-Frontend
npm install
```
### Create ```.env``` file:
```
Input your values :)
Working on Test Keys to Provide with Rate Limits 
```
### Run: 
```
npm run dev
```

## 🧪 Testing Strategy

### API Testing
- All REST APIs are tested using **Postman**
- Separate collections for:
  - Auth
  - Rides
  - Chat

### Route-Level Authentication Tests
- Verify JWT is required for all protected routes
- Reject requests with:
  - Missing token
  - Invalid token
  - Expired token
- Ensure users cannot access resources they do not own


## 👨‍💻 Author

**Divyansh Garg**  
Built as a real-world, security-focused system for college students.

