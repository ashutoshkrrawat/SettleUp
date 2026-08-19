# SettleUp — Real-Time Expense Splitting Platform

> A production-grade, full-stack expense management application with real-time synchronization, AI-powered expense parsing, UPI payment integration, and a greedy debt-minimization algorithm.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75FF?style=for-the-badge&logo=google&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge)

---

## Overview

SettleUp solves the common problem of tracking shared expenses across groups — trips, flat mates, events — and settling debts with minimal friction. Rather than requiring multiple peer-to-peer transactions, it computes the mathematically optimal settlement plan and allows members to pay each other directly through an integrated UPI gateway.

---

## Features

**Authentication & Security**
- JWT-based stateless authentication with bcrypt password hashing
- `express-rate-limit` on all auth endpoints to prevent brute-force attacks
- Helmet security headers and strict CORS configuration

**Group Management**
- Create groups and invite members via email or shareable time-limited invite links
- In-app pending invitation system with accept/decline flow
- Member removal with balance-guard validation (prevents leaving with active debts)

**Expense Splitting**
- Three split modes: **Equal** (with floating-point cent correction), **Exact amounts**, and **Percentage-based** (enforces 100% sum validation)
- Automatic group balance recalculation on every expense creation or settlement

**AI-Powered Expense Entry (Google Gemini 2.5 Flash)**
- **Voice Assistant**: Record audio or speak naturally (e.g. *"Split 1200 rupees for dinner equally in Goa Trip"*); Gemini parses the audio multimodally and pre-fills the expense form
- **Receipt OCR**: Upload a receipt image; Gemini vision extracts the vendor name, total amount, and suggested split type automatically
- **Fault Tolerance**: Implements API key pool rotation and multi-model fallback (`gemini-2.5-flash` -> `gemini-1.5-flash` -> `gemini-2.0-flash`) with a regex-based offline parser as a final fallback

**Debt Settlement**
- Greedy two-pointer algorithm computes the minimum number of transactions to fully settle all group debts (see [Algorithm](#the-settle-up-algorithm))
- **Razorpay UPI Gateway**: Members can pay settlements directly in-app; server verifies each payment using HMAC-SHA256 signature cryptography before marking debts as settled
- Socket.io broadcasts updated balances to all active group members in real time after a verified payment

**Async Infrastructure**
- BullMQ + Redis task queues handle debt reminder emails and group invitation emails asynchronously, keeping the request lifecycle non-blocking
- Nodemailer delivers emails via configurable SMTP (Gmail, Ethereal, or any provider)

---

## The Settle-Up Algorithm

Group expenses are aggregated into a **net balance per member** — positive means the member is owed money, negative means they owe money.

The algorithm applies a **greedy two-pointer approach** on sorted creditor and debtor arrays:

1. Sort creditors (positive balances) and debtors (negative balances) descending by absolute amount.
2. At each step, match the largest creditor with the largest debtor and settle for `min(creditor.amount, debtor.amount)`.
3. Advance the pointer of whichever side is fully settled, and repeat.

This guarantees the **minimum possible number of payment transactions** — at most `N - 1` for a group of `N` members — compared to the naive O(N²) pairwise approach. The sorting step gives an overall time complexity of **O(N log N)**.

---

## Architecture

```
ExpenseSplitter/
├── server/                     # Node.js + Express.js backend
│   ├── config/                 # MongoDB, Redis, Socket.io, BullMQ initialization
│   ├── controllers/            # HTTP request handlers (thin layer, delegates to services)
│   ├── services/               # Core business logic (expenses, groups, AI, payments)
│   ├── routes/                 # Express routers with middleware attachment
│   ├── middleware/             # JWT authentication middleware
│   └── model/                  # Mongoose schemas: User, Group, Expense
│
└── frontend/                   # React 19 + Vite
    └── src/
        ├── pages/              # Home, Auth, Dashboard, GroupDetails, JoinGroup, About
        ├── components/         # NavBar, Sidebar, VoiceAIModal, modals, charts
        ├── context/            # Global state and Socket.io client (DataContext)
        ├── utils/              # Axios instance with JWT request interceptors
        └── services/           # Frontend API service modules
```

**Layered Pattern**: `Route → Controller → Service` — HTTP concerns are fully separated from business logic, making services independently testable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Node.js, Express v5, JWT, Helmet, CORS, express-rate-limit |
| Database | MongoDB, Mongoose ODM |
| Real-time | Socket.io |
| AI | Google Gemini 2.5 Flash (`@google/genai`) — vision + audio multimodal |
| Payments | Razorpay UPI (order creation + HMAC-SHA256 server-side verification) |
| Async Jobs | BullMQ, Redis, Nodemailer |
| Dev Tooling | Nodemon, Concurrently, bundled Redis binary |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or MongoDB Atlas)
- Redis — a Redis binary is bundled in `server/redis/` for local development on Windows; on Linux/macOS install via your package manager

### 1. Clone the repository

```bash
git clone https://github.com/ashutoshkrrawat/ExpenseSplitter.git
cd ExpenseSplitter
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file inside `server/` using the following template:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/expense-splitter
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# SMTP (Gmail example — use an App Password if 2FA is enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Razorpay (test keys from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Gemini API — comma-separated keys for pool rotation
GEMINI_API_KEY=your_gemini_api_key_1,your_gemini_api_key_2
```

Start the backend (launches Redis and the Express server concurrently):

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at **http://localhost:5173**.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the Express server |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `JWT_EXPIRE` | No | Token expiry duration (default: `30d`) |
| `CLIENT_URL` | Yes | Frontend origin for CORS and invite links |
| `REDIS_HOST` | No | Redis host (default: `127.0.0.1`) |
| `REDIS_PORT` | No | Redis port (default: `6379`) |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Yes | SMTP sender email address |
| `SMTP_PASS` | Yes | SMTP password or app-specific password |
| `RAZORPAY_KEY_ID` | No | Razorpay API key ID (payment UI skipped if absent) |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret for HMAC signature verification |
| `GEMINI_API_KEY` | No | One or more Gemini API keys, comma-separated |

> If `RAZORPAY_KEY_ID` is not set, the payment flow operates in a simulated sandbox mode.
> If `GEMINI_API_KEY` is not set, voice and receipt parsing fall back to a built-in regex parser.

---

## License

MIT
