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
*   **Doubts & Concepts Journaling Rule**: Maintain [doubts.md](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/doubts.md) in the root directory. Whenever the developer asks a conceptual question or doubt, document the question, detailed explanation, and key takeaways in `doubts.md` to preserve learned concepts across sessions.
*   **Interactive Questioning Rule**: Ask interactive questions while creating or walking through files together to check understanding, confirm design choices, and make learning active.

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

### Phase 6: Core Bugfixes & Email Invitation Workflow ── ✅ COMPLETE & VERIFIED
*   [x] **Issue 1 (Duplicate Members)**: Deduplicated `members` and `balances` arrays in [groupService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/groupService.js) when loading or joining groups.
*   [x] **Issue 2 (Auth Toast & Inline Error Alert)**: Added inline red error banner and toast notifications in [Auth.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Auth.jsx) for invalid credentials and existing user registration errors.
*   [x] **Issue 3 (Exact & Percent Expense Logging)**: Fixed `handleAddExpenseSubmit` and `handleCustomSplitChange` in [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx) to automatically calculate exact total amounts and format percentage objects cleanly.
*   [x] **Issue 4 (Leave Group Option)**: Added a "Leave Group" button in [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx) for active members (with balance validation).
*   [x] **Issue 5 (Email Invitations & In-App Permission)**: Implemented `pendingInvites` schema in [Group.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/model/Group.js), sent actual invitation emails via Nodemailer, and added an in-app "Pending Group Invitations" banner with Accept/Decline options in [Dashboard.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Dashboard.jsx).
*   [x] **Issue 6 (Email Stuck at "Sending...")**: Added a 15s timeout to Axios in [api.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/utils/api.js), socket timeouts in Nodemailer [reminderWorker.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/reminderWorker.js), a 5s race timeout in [reminderQueue.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/config/reminderQueue.js), and loading state flags in [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx).

---

### Phase 7: Resume-Ready Cleanup — ✅ COMPLETE
*   [x] Installed `helmet`, `express-rate-limit`, `cors` on backend.
*   [x] Updated [server.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/server.js): removed dev `/home` endpoint, added `helmet`, `cors`, global error handler, fixed default port to `8000`.
*   [x] Applied `authLimiter` (10 req / 15 min) to `POST /register` and `POST /login` in [auth.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/auth.js).
*   [x] Deleted `Test.jsx` dev page and removed its route + export.
*   [x] Rewrote [About.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/About.jsx) as a polished tech-stack showcase page (features, stack cards, algorithm explainer).
*   [x] Fixed [Home.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/Home.jsx): "Demo Sandbox" → "See How It Works" → links to `/about`.
*   [x] Rewrote [README.md](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/README.md) with tech badges, features, architecture, and setup instructions.

---

### Phase 8: Voice AI Assistant — ✅ COMPLETE
*   [x] Created `aiService.js` with Gemini 2.5 Flash (`@google/genai`) structured JSON parser & Regex fallback engine.
*   [x] Mounted `POST /api/expenses/ai-parse` in [expenseController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/expenseController.js) and [expense.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/expense.js).
*   [x] Created custom Web Speech API hook `useVoiceRecognition.js` in [useVoiceRecognition.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/hooks/useVoiceRecognition.js).
*   [x] Built animated [VoiceAIModal.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/components/VoiceAIModal.jsx) with pulse recording, live transcript, and AI confirmation card.
*   [x] Integrated `Voice AI` mic button in [NavBar.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/components/NavBar.jsx).

---

### Phase 9: AI Receipt Vision Analyzer — ✅ COMPLETE & VERIFIED
*   [x] Added `parseReceiptImage` to [aiService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/aiService.js) using Gemini 2.5 Flash (`gemini-2.5-flash`) multimodal image `inlineData` input.
*   [x] Implemented multi-key API pool rotation & failover (`executeWithGeminiRotation`) in [aiService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/aiService.js) to support comma-separated `GEMINI_API_KEY`s and eliminate rate limit quota exhaustion.
*   [x] Mounted `POST /api/expenses/analyze-receipt` controller handler and route protected by JWT `protect` middleware in [expenseController.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/controllers/expenseController.js) and [expense.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/routes/expense.js).
*   [x] Added `analyzeReceipt` service call in [expenseService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/services/expenseService.js).
*   [x] Built interactive [ReceiptModal.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/components/ReceiptModal.jsx) with Base64 preview, Gemini Vision scanner, prefilled confirmation form, and database sync.
*   [x] Integrated "Scan Receipt" button in [NavBar.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/components/NavBar.jsx).

---

## 🎯 Project Status: ✅ COMPLETE & RESUME-READY

All planned phases are done. The project is clean, hardened, and documented.

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


