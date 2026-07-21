import React, { createContext, useState, useContext, useEffect } from 'react';

const MockDataContext = createContext();

export const useMockData = () => useContext(MockDataContext);

const initialUsers = [
  { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
  { _id: 'u2', name: 'Bob', email: 'bob@example.com' },
  { _id: 'u3', name: 'Charlie', email: 'charlie@example.com' },
];

const initialGroups = [
  {
    _id: 'g1',
    name: 'Goa Trip 2026 🌴',
    description: 'Expenses for flight, villas, and dinners.',
    createdBy: 'u1',
    members: ['u1', 'u2', 'u3'],
    balances: [
      { user: 'u1', balance: 60.00 },
      { user: 'u2', balance: -10.00 },
      { user: 'u3', balance: -50.00 },
    ],
  },
  {
    _id: 'g2',
    name: 'Flat 404 🏠',
    description: 'Monthly rent, groceries, and internet bills.',
    createdBy: 'u2',
    members: ['u1', 'u2'],
    balances: [
      { user: 'u1', balance: 0.00 },
      { user: 'u2', balance: 0.00 },
    ],
  },
];

const initialExpenses = [
  {
    _id: 'e1',
    group: 'g1',
    description: 'Villa Booking Deposit',
    amount: 150.00,
    splitType: 'EQUAL',
    paidBy: 'u1',
    splits: [
      { user: 'u1', amount: 50.00 },
      { user: 'u2', amount: 50.00 },
      { user: 'u3', amount: 50.00 },
    ],
    date: new Date('2026-07-20T10:00:00.000Z'),
  },
  {
    _id: 'e2',
    group: 'g1',
    description: 'Dinner at Beach Shack',
    amount: 30.00,
    splitType: 'PERCENT',
    paidBy: 'u1',
    splits: [
      { user: 'u1', amount: 15.00, percentage: 50 },
      { user: 'u2', amount: 9.00, percentage: 30 },
      { user: 'u3', amount: 6.00, percentage: 20 },
    ],
    date: new Date('2026-07-21T20:30:00.000Z'),
  },
];

export const MockDataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(initialUsers[0]); // Alice logged in by default
  const [users, setUsers] = useState(initialUsers);
  const [groups, setGroups] = useState(initialGroups);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const loginMockUser = (email) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      return found;
    } else {
      const name = email.split('@')[0];
      const newUser = { _id: 'u_' + Date.now(), name: name.charAt(0).toUpperCase() + name.slice(1), email };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return newUser;
    }
  };

  const logoutMockUser = () => {
    setCurrentUser(null);
  };

  const createGroup = (name, description) => {
    const newGroup = {
      _id: 'g_' + Date.now(),
      name,
      description,
      createdBy: currentUser._id,
      members: [currentUser._id],
      balances: [{ user: currentUser._id, balance: 0 }],
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const inviteMemberByEmail = (groupId, email) => {
    let targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      const name = email.split('@')[0];
      targetUser = { _id: 'u_' + Date.now(), name: name.charAt(0).toUpperCase() + name.slice(1), email };
      setUsers(prev => [...prev, targetUser]);
    }

    setGroups(prevGroups =>
      prevGroups.map(group => {
        if (group._id === groupId) {
          if (group.members.includes(targetUser._id)) return group;
          return {
            ...group,
            members: [...group.members, targetUser._id],
            balances: [...group.balances, { user: targetUser._id, balance: 0 }],
          };
        }
        return group;
      })
    );
  };

  const addExpense = ({ groupId, description, amount, splitType, paidBy, splits }) => {
    const newExpense = {
      _id: 'e_' + Date.now(),
      group: groupId,
      description,
      amount,
      splitType,
      paidBy,
      splits,
      date: new Date(),
    };

    setExpenses(prev => [newExpense, ...prev]);

    setGroups(prevGroups =>
      prevGroups.map(group => {
        if (group._id === groupId) {
          const updatedBalances = group.balances.map(b => {
            let newBal = b.balance;
            if (b.user === paidBy) {
              newBal += amount;
            }
            const matchSplit = splits.find(s => s.user === b.user);
            if (matchSplit) {
              newBal -= matchSplit.amount;
            }
            return { ...b, user: b.user, balance: Math.round(newBal * 100) / 100 };
          });
          return { ...group, balances: updatedBalances };
        }
        return group;
      })
    );
  };

  const deleteExpense = (expenseId) => {
    const expense = expenses.find(e => e._id === expenseId);
    if (!expense) return;

    setExpenses(prev => prev.filter(e => e._id !== expenseId));

    setGroups(prevGroups =>
      prevGroups.map(group => {
        if (group._id === expense.group) {
          const updatedBalances = group.balances.map(b => {
            let newBal = b.balance;
            if (b.user === expense.paidBy) {
              newBal -= expense.amount;
            }
            const matchSplit = expense.splits.find(s => s.user === b.user);
            if (matchSplit) {
              newBal += matchSplit.amount;
            }
            return { ...b, user: b.user, balance: Math.round(newBal * 100) / 100 };
          });
          return { ...group, balances: updatedBalances };
        }
        return group;
      })
    );
  };

  const getSettlements = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    if (!group) return [];

    const creditors = [];
    const debtors = [];

    group.balances.forEach(b => {
      const bal = Math.round(b.balance * 100) / 100;
      if (bal > 0.01) {
        creditors.push({ user: b.user, amount: bal });
      } else if (bal < -0.01) {
        debtors.push({ user: b.user, amount: -bal });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0;
    let j = 0;

    const tempCreditors = creditors.map(c => ({ ...c }));
    const tempDebtors = debtors.map(d => ({ ...d }));

    while (i < tempCreditors.length && j < tempDebtors.length) {
      const creditor = tempCreditors[i];
      const debtor = tempDebtors[j];

      const settledAmount = Math.min(creditor.amount, debtor.amount);
      const roundedSettled = Math.round(settledAmount * 100) / 100;

      if (roundedSettled > 0) {
        transactions.push({
          from: debtor.user,
          to: creditor.user,
          amount: roundedSettled,
        });
      }

      creditor.amount = Math.round((creditor.amount - settledAmount) * 100) / 100;
      debtor.amount = Math.round((debtor.amount - settledAmount) * 100) / 100;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return transactions;
  };

  return (
    <MockDataContext.Provider
      value={{
        currentUser,
        users,
        groups,
        expenses,
        theme,
        toggleTheme,
        loginMockUser,
        logoutMockUser,
        createGroup,
        inviteMemberByEmail,
        addExpense,
        deleteExpense,
        getSettlements,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
};
