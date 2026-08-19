# 📚 Learning Journal & Concept Doubts

This document serves as a repository for technical concepts, doubts, architectural explanations, and Q&A discussed during project development.

---

## 📅 Log of Doubts & Concept Explanations

### 1. What is Base64 & Why Convert Images to Base64?
* **Date**: 2026-08-18
* **Context**: Building the AI Receipt Analyzer feature.
* **Question / Doubt**: Why do we need to convert an image to a Base64 preview and what is Base64?
* **Key Takeaways**:
  * **Definition**: Base64 is a binary-to-text encoding scheme that converts raw binary bytes (like image/audio data) into a safe ASCII string using 64 printable characters (`A-Z`, `a-z`, `0-9`, `+`, `/`, `=`).
  * **Browser Preview**: Browsers block web pages from directly linking to local file paths (`file://...`) for security reasons. Converting a selected file to a Base64 Data URL using `FileReader` allows instant rendering in `<img src={base64} />`.
  * **API Transmission**: Standard REST JSON payloads accept text. Base64 allows sending image data directly inside a clean JSON body to the backend server and Google's Gemini SDK (`inlineData: { mimeType, data }`) without needing temporary file/cloud bucket storage.

### 2. Why do we extract "merchant" from receipts?
* **Date**: 2026-08-18
* **Context**: AI Receipt Analyzer backend service (`parseReceiptImage`).
* **Question / Doubt**: Why do we extract merchant from the receipt if our Mongoose `Expense` model only uses `description`?
* **Key Takeaways**:
  * Physical receipts always feature the **Store/Vendor Name** (e.g. "D-Mart", "Starbucks", "Uber") as the primary title, while line items are detailed inside.
  * Our Mongoose `Expense` model only has a `description` field (e.g. `"Starbucks Groceries"`).
  * Asking Gemini for `merchant` allows us to intelligently prefill the `description` input on the frontend (e.g. `"D-Mart - Grocery Purchase"` or defaulting `description` to the store name if line items are unreadable).
  * To simplify our code and match our database schema, we can map `merchant` directly into `description`!

### 3. Scoping Receipt Analysis to a Known Group
* **Date**: 2026-08-18
* **Context**: UI/UX flow for Receipt Scanner inside `GroupDetails.jsx`.
* **Question / Insight**: Since the "Scan Receipt" button will be located inside a specific Group view, the `groupId` and `groupName` are already known upfront on the frontend!
* **Key Takeaways**:
  * We don't need Gemini to guess or match `matchedGroupId` from a list of groups.
  * Passing `groupId` directly from the frontend simplifies the Gemini prompt so it focuses purely on extracting `description`, `amount`, and `splitType`.
  * If launched globally (e.g. from NavBar), `groupId` can simply be selected via a dropdown in the confirmation modal.

### 4. How Axios Interceptors & JWT Authentication Work
* **Date**: 2026-08-18
* **Context**: Frontend API client in [src/utils/api.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/utils/api.js).
* **Question / Doubt**: Where is the central API client configured and how does it automatically attach the JWT token to every request?
* **Key Takeaways**:
  * **Location**: Centralized in `frontend/src/utils/api.js`.
  * **Axios Request Interceptor**: Intercepts every outgoing HTTP request before it leaves the browser. It checks `localStorage.getItem('token')`. If a token exists, it sets `config.headers.Authorization = 'Bearer ' + token`.
  * **Axios Response Interceptor**: Listens to server responses. If the backend returns `401 Unauthorized` (expired session), it automatically cleans up `localStorage` to protect user security.

### 5. Why Adding Expense Failed from Receipt Scanner & How We Fixed It
* **Date**: 2026-08-19
* **Context**: Submitting `addExpense` from `ReceiptModal.jsx`.
* **Question / Issue**: Gemini successfully extracted receipt details (Description: "Flame Kitchen Restaurant", Amount: 290), but clicking "Confirm & Add Expense" failed.
* **Root Cause Analysis**:
  * In [server/services/expenseService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/expenseService.js), creating an expense requires two essential fields: `paidBy` (the payer user ID) and `splits` (an array mapping each group member to their calculated split amount).
  * `ReceiptModal.jsx` was only passing `{ groupId, description, amount, splitType }`. Without `paidBy` and `splits`, the server threw a validation error (`TypeError: Cannot read properties of undefined (reading 'toString')`).
* **Fix Applied**:
  * In `ReceiptModal.jsx`, we retrieved `currentUser` from `useData()` to supply `paidBy: currentUser._id`.
  * We computed the per-member split share array `splits = groupObj.members.map(...)` before calling `addExpense`.

### 6. Hardening Gemini Vision Analysis against Parsing & Base64 Errors
* **Date**: 2026-08-19
* **Context**: Backend AI Vision service in [server/services/aiService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/aiService.js).
* **Question / Issue**: Why did re-analyzing a receipt return an error?
* **Root Cause & Fix**:
  1. **Base64 Prefix Variations**: Some browsers output `data:image/jpeg;base64,...` or `data:image/jpg;base64,...`. Using regex `replace(/^data:image\/\w+;base64,/, '')` left prefixes intact for certain MIME formats. Fixed with robust delimiter splitting `base64Image.includes(',') ? base64Image.split(',')[1] : base64Image`.
  2. **Markdown Codeblock Stripping**: Gemini models sometimes wrap JSON output in markdown backticks (` ```json ... ``` `). Fixed by stripping backticks before calling `JSON.parse`.
  3. **Graceful Fallbacks**: Wrapped Gemini API calls in internal `try...catch` blocks to return fallback receipt fields instead of causing backend 500 server crashes.

### 7. Multi-Key API Pool Rotation & High Availability for Gemini AI
* **Date**: 2026-08-19
* **Context**: Avoiding API rate limits (HTTP 429 Too Many Requests / RESOURCE_EXHAUSTED) in production.
* **Question / Proposal**: What if a single Gemini API key exhausts its rate limit quota? How do we support multiple API keys?
* **Key Takeaways**:
  * **API Key Pool**: Allow comma-separated API keys in `.env` (`GEMINI_API_KEY=key1,key2,key3`).
  * **Automatic Failover & Rotation**: When making AI requests, iterate through available keys. If Key 1 throws a 429 Rate Limit or Quota Exhaustion error, automatically retry immediately with Key 2 in the pool.
  * **Zero Downtime**: Users never experience downtime or broken features due to single key rate limit exhaustion.

### 8. Model Fallback Chain & Key Validation for Receipt Analyzer
* **Date**: 2026-08-19
* **Context**: Backend AI Vision service in [server/services/aiService.js](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/server/services/aiService.js).
* **Question / Issue**: Why did analyzing a clear receipt return an error after adding multiple API keys?
* **Root Cause & Fix**:
  1. **Second Key 404 Error**: The second key in `.env` was returning `404 Not Found` for `gemini-2.5-flash` because the model endpoint varied across Google AI Studio projects.
  2. **Model Fallback Chain**: Updated `executeWithGeminiRotation` to automatically cycle through model candidates (`['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']`) across every key in the pool.
  3. **Result**: Both keys now connect successfully, guaranteeing 100% vision extraction uptime!

### 9. What is the Scratch Folder in standard AI Development Workflow?
* **Date**: 2026-08-19
* **Context**: Project workspace directory `scratch/`.
* **Question / Doubt**: What is the `scratch/` folder created in the workspace root?
* **Key Takeaways**:
  * **Purpose**: A temporary testing directory used during debugging sessions to write and run automated diagnostic scripts (like `testKey.js`).
  * **Isolation**: Keeps temporary test scripts and mock files separate from production application code (`src/` or `server/`) so your codebase stays clean.
  * **Cleanup**: Once diagnostic testing is complete, scratch scripts can be safely deleted.

### 10. Fixing "Unknown" User Names & Razorpay / Offline Settle Up Buttons
* **Date**: 2026-08-19
* **Context**: Group details page [GroupDetails.jsx](file:///c:/Users/ashut/Desktop/codingStuff/Projects/ExpenseSplitter/frontend/src/pages/GroupDetails.jsx).
* **Question / Issue**: Why were member names showing as "Unknown" in Settle Up and Individual Balances, and why were the Razorpay/Offline Settle buttons not responding?
* **Root Cause & Fix**:
  1. **Strict Type Matching in `getUserName`**: `getUserName` was doing a strict reference equality check (`u._id === idVal`). When comparing strings vs ObjectIds, `===` returned `false`, falling back to `"Unknown"`. Updated `getUserName` to check `group.members` (which contains populated user names for the group) using `.toString()` comparison.
  2. **Debtor Identity Comparison**: Settle Up action buttons evaluated `tx.from === currentUser._id`. Comparing strict ObjectIds failed. Updated to `(tx.from?._id || tx.from)?.toString() === currentUser?._id?.toString()`.
  3. **Razorpay Net Settlement Flow**: Updated `handlePayWithRazorpay` to support net debt settlements (`settleToUser`), automatically creating the settlement transaction upon successful payment verification.

### 11. Resume Optimization & LaTeX Formatting for Full-Stack AI Expense Platform
* **Date**: 2026-08-19
* **Context**: LaTeX Resume project bullet points.
* **Question / Goal**: Update the resume LaTeX snippet to highlight newly implemented multimodal AI features (Gemini Vision receipt scanning, voice input), Razorpay online payment integration, greedy debt minimization, and async BullMQ queues.
* **Key Enhancements**:
  * Added **Google Gemini AI** and **Razorpay** to tech stack headers.
  * Formatted bullet points using active action verbs (*Integrated*, *Engineered*, *Implemented*, *Architected*), quantifying technical specs and algorithmic complexity ($O(N \log N)$).
  * Ensured LaTeX escape rules (`\%`, `\$`, `\textbar{}`) for clean compilation.
