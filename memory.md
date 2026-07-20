# Project Memory — Expense Splitter Setup

This file is a handoff document to persist state, progress, and instructions between sessions. If you are starting a new chat session, please read this file first to resume exactly where we left off.

---

## 👩‍🏫 Working Persona (CRITICAL)
*   **Role**: Mentor/Teacher.
*   **Instruction**: **DO NOT write code yourself or edit project files directly** unless explicitly asked. Your job is to:
    1. Explain the underlying concepts (e.g. JWTs, Mongoose population, WebSockets).
    2. Guide the developer step-by-step on what directories and files to create.
    3. Provide code templates and snippets in chat for the developer to write/paste.
    4. Review their code, explain why bugs occur, and help them debug.
*   **Memory Update Rule**: Whenever a new file is created or a new instruction is given, update `memory.md` immediately to persist state for future sessions.

---

## 🚀 Project Overview & Tech Stack
A real-time, multi-user expense-splitting web app. 
*   **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Shadcn-like styling.
*   **Backend**: Node.js, Express, MongoDB/Mongoose.
*   **Real-time**: Socket.io.
*   **Async Jobs**: Redis, BullMQ (for reminders).

---

## 📊 Current Progress & Status

*   **Documentation**: Created [README.md](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/README.md) describing the splitting modes (including the dynamic EXACT total sum approach) and the greedy transaction-minimizing algorithm.

### Phase 1: Authentication & JWT Setup ── ✅ COMPLETE & VERIFIED
Completed and tested JWT register, login, and protected me endpoints.

### Phase 2: Group Management ── ✅ COMPLETE & VERIFIED
*   Group CRUD operations, email invites, invite links, and member removal/leaving functionality are fully implemented and registered.

---

## 🎯 Next Steps (Where to Start Tomorrow)

### 1. Task 1: Create Layered Architecture for Expense Splitting
To keep this production-grade, we will implement Route-Controller-Service files:
*   [NEW] `server/services/expenseService.js`: Implements split logic (EQUAL, PERCENT, EXACT) and MongoDB balance updates.
*   [NEW] `server/controllers/expenseController.js`: Translates request/response HTTP actions.
*   [NEW] `server/routes/expense.js` & Mount in `server/server.js`: Connects protect middleware and paths.

### 2. Task 2: Implement Settle-Up Engine
Create a `/settlements` endpoint in `group` routes utilizing the greedy simplified settlements algorithm.

### 3. Task 3: Test Layered Expense Routes in Postman

---

## 🗺️ Remaining Road Map
*   **Phase 3**: Core Expense Splitting & Settle-Up Engine (Route-Controller-Service layered implementation).
*   **Phase 4**: Socket.io real-time room sync.
*   **Phase 5**: BullMQ/Redis async notification setup.
