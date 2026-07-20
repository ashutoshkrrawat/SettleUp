# 💸 Expense Splitter

A real-time, multi-user expense splitting application built with Node.js, Express, MongoDB, Socket.io, and React. 

This document explains the core architectural designs, math calculations, and algorithms that govern how expenses are split and how balances are settled in the application.

---

## 🏗️ Architecture & Core Concepts

### 1. The Balance Sheet Design (Cached Balances)
Instead of scanning every transaction in the database whenever a user visits their group dashboard, this application uses a **cached-on-write balance engine**.
* Running balances are stored directly in the `Group` model in a `balances` array:
  ```json
  "balances": [
    { "user": "Alice_ID", "balance": 60.00 },
    { "user": "Bob_ID", "balance": -10.00 },
    { "user": "Charlie_ID", "balance": -50.00 }
  ]
  ```
* **Positive Balance ($+$)**: Creditor (owed money).
* **Negative Balance ($-$)**: Debtor (owes money).
* **Net-Zero Rule**: In any group, the sum of all members' balances must always equal **exactly 0**.
* **Transactions Updates**:
  * **On Creation**: The payer's balance increases by the total amount. Split participants' balances decrease by their individual shares.
  * **On Deletion**: The inverse operation is performed (reverting the credit from the payer and debt from participants).

---

## 🧮 Splitting Mechanics

The application supports three split modes:

### A. Equal Split (`EQUAL`)
* **Concept**: The total amount is divided equally among selected participants.
* **Cents Rounding Safety**: When dividing decimal currencies (e.g. dividing \$10.00 among 3 users), standard division yields infinite decimals ($3.3333...$). If we round everyone to \$3.33, \$0.01 is lost. 
* **Our Solution**: The backend calculates the floor share (\$3.33) and distributes the remainder cents one-by-one to participants (e.g. User 1 pays \$3.34, User 2 pays \$3.33, User 3 pays \$3.33), satisfying the exact receipt total.

### B. Percentage Split (`PERCENT`)
* **Concept**: Users specify the exact share percentage each participant owes (e.g. 50% / 30% / 20%).
* **Validation**: The sum of percentages must equal exactly **100%**.
* **Rounding Protection**: Share amounts are computed as `(percentage / 100) * totalAmount`, rounded to 2 decimals. The first participant's share is adjusted for any minor decimal difference between the sum of shares and the total amount.

### C. Exact Split (`EXACT`)
* **Concept**: Users input custom amounts for selected members directly (e.g., Alice owes \$15, Bob owes \$25).
* **Dynamic Amount Calculation**: To maximize user convenience, the total expense amount is calculated dynamically as the **sum of all individual split inputs**. Payer gets credited this calculated total sum, and members are debited their input amounts.

---

## 🤝 Settle-Up Engine (Greedy Debt Minimizer)

Rather than forcing users to make dozens of individual peer-to-peer transfers, we run a **Greedy Debt Minimization Algorithm** to find the absolute minimum number of transactions needed to resolve all debts.

### 📝 Tracing Example
Assume a group contains **Alice**, **Bob**, and **Charlie** with the following balance sheet:
* **Alice**: $+\$60$
* **Bob**: $-\$10$
* **Charlie**: $-\$50$

The algorithm works as follows:
1. **Categorize and Sort**:
   * **Creditors**: `[ { Alice, owed $60 } ]`
   * **Debtors**: `[ { Charlie, owes $50 }, { Bob, owes $10 } ]` (Sorted descending)
2. **Greedy Matching**:
   * Match the largest debtor (**Charlie**, owes \$50) with the largest creditor (**Alice**, owed \$60).
   * Transaction: **Charlie pays Alice \$50**.
   * Update: Charlie is settled (\$0). Alice is still owed $\$60 - \$50 = \$10$.
   * Match the next largest debtor (**Bob**, owes \$10) with the remaining creditor (**Alice**, owed \$10).
   * Transaction: **Bob pays Alice \$10**.
   * Update: Everyone is fully settled (\$0).
3. **Optimized Outcome**: Instead of a complex web of transactions, the algorithm outputs exactly 2 payments to resolve the group.

### 💻 Algorithm Implementation
```javascript
function getSettlements(balances) {
  let creditors = [];
  let debtors = [];

  // Separate and clean floating errors
  balances.forEach(b => {
    const amount = Math.round(b.balance * 100) / 100;
    if (amount > 0) {
      creditors.push({ user: b.user, amount });
    } else if (amount < 0) {
      debtors.push({ user: b.user, amount: -amount });
    }
  });

  // Sort highest to lowest
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    if (creditor.amount < 0.01) { i++; continue; }
    if (debtor.amount < 0.01) { j++; continue; }

    const settledAmount = Math.min(creditor.amount, debtor.amount);
    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amount: Math.round(settledAmount * 100) / 100
    });

    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
}
```
