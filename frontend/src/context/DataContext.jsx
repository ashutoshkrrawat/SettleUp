import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

// Import our modular services
import authService from '../../services/authService';
import groupService from '../../services/groupService';
import expenseService from '../../services/expenseService';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

let socket;

export const DataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  
  const currentGroupIdRef = useRef(null);

  // Sync dark/light theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Load profile on startup if a token exists
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await authService.getMe();
      setCurrentUser(user);
      connectSocket();
    } catch (err) {
      console.error('Session expired or invalid:', err.message);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io Real-time connection
  const connectSocket = () => {
    if (socket) return;
    
    socket = io('http://localhost:8000');
    
    socket.on('connect', () => {
      console.log('🔌 Websocket connection active');
      if (currentGroupIdRef.current) {
        socket.emit('join_group', currentGroupIdRef.current);
      }
    });

    // Real-time: Refresh group data when another user creates an expense
    socket.on('expense_created', (newExpense) => {
      if (currentGroupIdRef.current === newExpense.group) {
        toast.info(`New expense added: ${newExpense.description}`);
        fetchGroupDetails(newExpense.group);
        fetchExpensesForGroup(newExpense.group);
      }
    });

    // Real-time: Refresh group data when another user deletes an expense
    socket.on('expense_deleted', ({ expenseId, groupId }) => {
      if (currentGroupIdRef.current === groupId) {
        toast.info('An expense was deleted');
        fetchGroupDetails(groupId);
        fetchExpensesForGroup(groupId);
      }
    });
  };

  const joinGroupRoom = (groupId) => {
    currentGroupIdRef.current = groupId;
    if (socket && socket.connected) {
      socket.emit('join_group', groupId);
    }
  };

  const leaveGroupRoom = (groupId) => {
    if (currentGroupIdRef.current === groupId) {
      currentGroupIdRef.current = null;
    }
    if (socket && socket.connected) {
      socket.emit('leave_group', groupId);
    }
  };

  useEffect(() => {
    loadUser();
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // API wrappers to fetch and set state
  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const data = await groupService.getGroupDetails(groupId);
      setGroups(prev => {
        const exists = prev.some(g => g._id === groupId);
        if (exists) {
          return prev.map(g => g._id === groupId ? data : g);
        } else {
          return [data, ...prev];
        }
      });
      if (data.members) {
        setUsers(data.members);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch group details:', err.message);
    }
  };

  const fetchExpensesForGroup = async (groupId) => {
    try {
      const data = await expenseService.getGroupExpenses(groupId);
      setExpenses(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch group expenses:', err.message);
    }
  };

  const loginUser = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    await loadUser();
    return data;
  };

  const registerUser = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem('token', data.token);
    await loadUser();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setGroups([]);
    setExpenses([]);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const createGroup = async (name, description) => {
    const data = await groupService.createGroup(name, description);
    setGroups(prev => [data, ...prev]);
    return data;
  };

  const inviteMemberByEmail = async (groupId, email) => {
    const data = await groupService.inviteMember(groupId, email);
    setGroups(prev => prev.map(g => g._id === groupId ? data : g));
    if (data.members) {
      setUsers(data.members);
    }
    return data;
  };

  const removeMember = async (groupId, userId) => {
    const data = await groupService.removeMember(groupId, userId);
    setGroups(prev => prev.map(g => g._id === groupId ? data : g));
    if (data.members) {
      setUsers(data.members);
    }
    return data;
  };

  const joinGroup = async (inviteCode) => {
    const data = await groupService.joinGroup(inviteCode);
    setGroups(prev => {
      const exists = prev.some(g => g._id === data._id);
      if (exists) {
        return prev.map(g => g._id === data._id ? data : g);
      } else {
        return [data, ...prev];
      }
    });
    return data;
  };

  const addExpense = async ({ groupId, description, amount, splitType, paidBy, splits }) => {
    const data = await expenseService.createExpense({ groupId, description, amount, splitType, paidBy, splits });
    setExpenses(prev => [data, ...prev]);
    await fetchGroupDetails(groupId);
    return data;
  };

  const deleteExpenseObj = async (expenseId) => {
    const data = await expenseService.deleteExpense(expenseId);
    setExpenses(prev => prev.filter(e => e._id !== expenseId));
    if (data.groupId) {
      await fetchGroupDetails(data.groupId);
    }
    return data;
  };

  const getSettlements = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    if (!group) return [];

    const creditors = [];
    const debtors = [];

    group.balances?.forEach(b => {
      const userId = b.user?._id || b.user;
      const bal = Math.round(b.balance * 100) / 100;
      if (bal > 0.01) {
        creditors.push({ user: userId, amount: bal });
      } else if (bal < -0.01) {
        debtors.push({ user: userId, amount: -bal });
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

  const sendGroupReminders = async (groupId) => {
    try {
      const data = await groupService.sendReminders(groupId);
      toast.success(`Success! Sent reminders to ${data.queuedJobs} member(s).`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      throw err;
    }
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        users,
        groups,
        expenses,
        theme,
        loading,
        toggleTheme,
        loginUser,
        registerUser,
        logoutUser: logout,
        createGroup,
        inviteMemberByEmail,
        removeMember,
        addExpense,
        deleteExpense: deleteExpenseObj,
        getSettlements,
        fetchGroups,
        fetchGroupDetails,
        fetchExpensesForGroup,
        joinGroupRoom,
        leaveGroupRoom,
        joinGroup,
        sendGroupReminders,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

