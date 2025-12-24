# 🚕 Cab Connect  
### A Secure, College-Only Cab Sharing Platform

Cab Connect is a **production-grade full-stack web application** designed to help college students efficiently share cab rides while ensuring **privacy, security, and trust**.  
It replaces unstructured WhatsApp groups with a **structured, searchable, and secure platform**.

---

## 🎯 Problem Statement

Students frequently share airport and city cab rides via WhatsApp groups.  
This approach suffers from:
- Message clutter & poor discoverability
- No structured communication per ride

**Cab Connect solves this with a college-verified, ride-centric system.**

---

## ✨ Key Features

- 🎓 **College Email Authentication**
  - Only users with `@learner.manipal.edu` can register
- 🚗 **Ride Creation & Discovery**
  - Search rides by date & time
- 👥 **Automatic Capacity Enforcement**
  - Maximum **4 members per ride**
- 💬 **Ride-Scoped Chat**
  - Communication limited to ride participants
- ⏳ **Automatic Ride Expiry**
  - Past rides are auto-deleted via background jobs
- 🔐 **Role-Based Authorization**
  - Creator / Participant access control
- 🛡 **Security-First Design**
  - JWT authentication, protected routes, data isolation

---

## 🧠 System Design Overview

```bash
Client (React)
|
| HTTPS + JWT
v
API Gateway (Express)
|
├── Auth Service
├── Ride Service
├── Chat Service
└── Cleanup Worker (Cron)
|
v
MongoDB
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
cab-connect/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── contexts/
│ │ └── services/
│ └── package.json
│
├── backend/
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

## 🔐 Authentication & Authorization

- Email domain validation during signup
- Password hashing using bcrypt
- JWT-based stateless authentication
- Middleware-protected routes
- Users can only:
  - Join rides with available slots
  - Access chats of rides they belong to
  - Modify rides they created

---

## 🧾 Database Schema (High-Level)

### User
- email
- name
- passwordHash
- createdAt

### Ride
- creatorId
- date
- time
- source
- destination
- participants[ ]
- status (active | full | expired)

### Message
- rideId
- senderId
- content
- timestamp

---

## 🚀 Local Setup

### Clone Repository
```bash
git clone https://github.com/your-username/cab_connect.git
cd cab_connect
```
### Backend Setup
```bash
cd Cab-Connect-Frontend/Cab-Connect-Backend
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

