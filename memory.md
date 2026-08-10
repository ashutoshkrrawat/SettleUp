# Project Memory — Expense Splitter Setup

This file is a handoff document to persist state, progress, and instructions between sessions. If you are starting a new chat session, please read this file first to resume exactly where we left off.

---

## 👩‍🏫 Working Persona & Strict Rules (CRITICAL)
*   **Role**: Mentor/Teacher.
*   **Permissions & File Editing**: The developer requested that the AI must first ask for confirmation before adding or modifying any code or files.
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

### Frontend Interactive Mockups ── ✅ COMPLETE & VERIFIED
*   [x] Install `framer-motion` & `recharts` dependencies.
*   [x] Configure [index.css](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/index.css) design system tokens.
*   [x] Create [MockDataContext.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/context/MockDataContext.jsx) for state management.
*   [x] Design instructions for page layouts and aesthetics.
*   [x] Implement interactive pages: [Home.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Home.jsx), [Auth.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Auth.jsx), [Dashboard.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Dashboard.jsx), and [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx).

### Phase 4: Frontend-Backend Connection ── ✅ COMPLETE & VERIFIED
*   [x] Configure Vite proxy in [vite.config.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/vite.config.js) to route `/api` calls to port `8000`.
*   [x] Create production-grade Axios client [api.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/utils/api.js) with JWT request headers interceptor.
*   [x] Implement modular services ([authService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/authService.js), [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/groupService.js), [expenseService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/expenseService.js)).
*   [x] Refactor state provider to [DataContext.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/context/DataContext.jsx) and bind Socket.io client.
*   [x] Remove all references to "Mock" naming from context providers, hooks, and imports across pages.
*   [x] Fix authentication return types so that the redirect works on login/register.
*   [x] Add `useEffect` hooks to [Dashboard.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Dashboard.jsx) and [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx) to load database records asynchronously on mount.
*   [x] Setup local MongoDB Compass testing environment.
*   [x] Create a new `JoinGroup.jsx` page component to handle invite link routing (`/join/:inviteCode`) in the frontend.
*   [x] Fix the "Copy Invite Link" logic in `GroupDetails.jsx` to use the group's unique `inviteCode` from the database.
*   [x] Fix the display of member names from 'Unknown' by extracting string IDs from populated objects.
*   [x] Prevent page refresh 404/Group Not Found and auth redirection by adding loading checks.
*   [x] Auto-calculate overall Amount on EXACT splitting scheme and disable redundant manual inputs.
*   [x] Verify live Socket.io events by testing group expenses and settlements updates between two browsers.

---

### Phase 5: BullMQ/Redis Async Notification Setup ── ✅ COMPLETE & VERIFIED
*   [x] Start local Redis server running on port `6379`.
*   [x] Add Redis and SMTP variables to backend `.env`.
*   [x] Create Redis connection config [redis.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/redis.js).
*   [x] Implement BullMQ queue [reminderQueue.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/reminderQueue.js).
*   [x] Create background Worker [reminderWorker.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/reminderWorker.js) with Nodemailer setup.
*   [x] Add `sendGroupReminders` core logic to [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/groupService.js) to automatically queue reminder emails for debtors.
*   [x] Add controller handler in [groupController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/groupController.js).
*   [x] Mount POST route `/api/groups/:id/remind` in [group.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/group.js).
*   [x] Initialize and load background worker at server boot in [server.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/server.js).
*   [x] Implement frontend service helper in [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/groupService.js) and context handler in [DataContext.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/context/DataContext.jsx).
*   [x] Add interactive "Send Reminders" button in [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx) to trigger notifications.
*   [x] Fix email spam placement by updating `from` address in [reminderWorker.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/reminderWorker.js) to match authenticated `SMTP_USER` with `"${requestorName} via Expense Splitter"` display format.

---

## 🎯 Next Steps
*   **Step 1**: Restart your Node.js backend server so it loads the updated `reminderWorker.js`.
*   **Step 2**: Trigger a reminder email from the frontend and verify it arrives directly in the recipient's primary **Inbox** rather than Spam.

---

## 🗺️ Remaining Road Map
*   **Phase 6 (Optional/Future)**: Production deployment setup & Resend/SendGrid transactional email integration.



---

## 💡 Revision Notes: Frontend-Backend Connection Details

### 1. Axios Client & Interceptors
*   **Client Location**: [api.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/utils/api.js)
*   **Base URL**: Configured as `/api`. 
*   **Vite Proxy**: In [vite.config.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/vite.config.js), requests targeting `/api` are proxied to `http://localhost:8000`.
*   **Request Interceptor**: Automatically retrieves the JWT token via `localStorage.getItem('token')` and appends it to the `Authorization` header as `Bearer <token>` for all outgoing API requests.
*   **Response Interceptor**: Intercepts error responses. If a `401 Unauthorized` status code is received (token expired or invalid), it automatically removes the token from `localStorage` to clean up the expired session.

### 2. Services Structure
*   The frontend uses dedicated service files to abstract all API interactions:
    *   [authService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/authService.js): Logic for register, login, and fetching current user.
    *   [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/groupService.js): Handles groups, invitations, resetting invite codes, and retrieving calculated debts/settlements.
    *   [expenseService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/expenseService.js): Handles creating and fetching expenses.

### 3. State & Socket.io Connection
*   **Context Provider**: Managed globally via [DataContext.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/context/DataContext.jsx).
*   **Real-time Synchronization**: When a user logs in, a Socket.io client connection is established. It listens to real-time events (like `expenseAdded`, `settledUp`, `groupUpdated`) and dynamically dispatches updates to the state so that other active group members see changes instantly without page reloads.

