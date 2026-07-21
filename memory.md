# Project Memory — Expense Splitter Setup

This file is a handoff document to persist state, progress, and instructions between sessions. If you are starting a new chat session, please read this file first to resume exactly where we left off.

---

## 👩‍🏫 Working Persona & Strict Rules (CRITICAL)
*   **Role**: Mentor/Teacher.
*   **Strict File Editing Constraint**: **DO NOT write code or edit any codebase files directly.** `memory.md` is the **ONLY** file you are permitted to modify/edit.
*   **Mentor Workflow**:
    1. Explain underlying architectural concepts and algorithms.
    2. Guide the developer step-by-step on what directories and files to create.
    3. Provide complete, formatted code templates and snippets in chat for the developer to write/paste.
    4. Review their code, explain why bugs occur, and help them debug.
*   **Mandatory Memory Update Rule**: You MUST update `memory.md` whenever new progress is made, code/file structure changes, or new instructions are given, ensuring context and state are fully preserved across sessions.

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

### Phase 3: Core Expense Splitting & Settle-Up Engine ── ✅ IMPLEMENTATION COMPLETE
*   [x] Refactored **Auth**, **Group**, and **Expense** modules into full **Route-Controller-Service** layered architecture:
    *   `services/`: [authService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/authService.js), [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/groupService.js), [expenseService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/expenseService.js)
    *   `controllers/`: [authController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/authController.js), [groupController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/groupController.js), [expenseController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/expenseController.js)
    *   `routes/`: [auth.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/auth.js), [group.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/group.js), [expense.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/expense.js) mounted in [server.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/server.js).
*   [x] Implemented `GET /api/groups/:id/settlements` greedy debt minimization algorithm.

---

## 🎯 Next Steps
*   **Task 1**: Test Phase 3 Endpoints (Expenses & Settlement engine) in Postman.
*   **Phase 4**: Socket.io real-time room sync.

---

## 🗺️ Remaining Road Map
*   **Phase 3**: Core Expense Splitting & Settle-Up Engine (Route-Controller-Service layered implementation).
*   **Phase 4**: Socket.io real-time room sync.
*   **Phase 5**: BullMQ/Redis async notification setup.
