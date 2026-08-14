# 💸 Splitter — Real-Time Expense Splitting App

> A full-stack, production-grade expense-splitting web app with real-time sync, async email notifications, and a greedy debt-minimizing algorithm.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing and rate-limited endpoints
- 👥 **Group Management** — Create groups, invite members via email or shareable invite links, leave/remove members
- 💰 **Flexible Expense Splitting** — Equal, percentage-based, or exact-amount splits with automatic total calculation
- ⚡ **Real-Time Sync** — Socket.io broadcasts expense additions and settlements instantly across all active group members
- 🧮 **Greedy Settle-Up Algorithm** — Resolves all group debts with the mathematically minimum number of transactions
- 📧 **Async Email Notifications** — BullMQ + Redis queue sends debt reminder emails in the background via Nodemailer
- 📩 **Email Invitations** — Invite users to groups via email; in-app "Pending Invitations" banner to accept/decline
- 🛡️ **Security Hardened** — Helmet, CORS, and per-route rate limiting on all auth endpoints

---

## 🧮 The Settle-Up Algorithm

All group expenses are aggregated into a **net-balance map** per member. A greedy two-pointer approach then repeatedly pairs the largest creditor with the largest debtor, resolving each pair in a single transaction.

This guarantees the **minimum possible number of payments** to settle all debts — an O(n log n) solution using a max-heap approach.

---

## 🏗️ Architecture

```
ExpenseSplitter/
├── server/                     # Node.js + Express backend
│   ├── config/                 # DB, Redis, Socket.io, BullMQ config
│   ├── controllers/            # Route handlers (thin layer)
│   ├── services/               # Core business logic
│   ├── routes/                 # Express routers
│   ├── middleware/             # JWT auth middleware
│   └── model/                  # Mongoose schemas (User, Group, Expense)
│
└── frontend/                   # React 19 + Vite frontend
    └── src/
        ├── pages/              # Home, Auth, Dashboard, GroupDetails, JoinGroup, About
        ├── context/            # Global state + Socket.io (DataContext)
        ├── utils/              # Axios client with JWT interceptors
        └── services/           # Frontend API service modules
```

**Pattern**: Route → Controller → Service (layered architecture separating HTTP handling from business logic)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ExpenseSplitter.git
cd ExpenseSplitter
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/expensesplitter
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173

# Nodemailer SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the backend (Redis + server together):

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Node.js, Express v5, JWT, Helmet, CORS, Rate Limiting |
| Database | MongoDB, Mongoose ODM |
| Real-time | Socket.io |
| Async Jobs | Redis, BullMQ, Nodemailer |
| Dev Tools | Nodemon, Concurrently, MongoDB Compass |

---

## 📄 License

MIT
