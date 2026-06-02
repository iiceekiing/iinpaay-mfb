import { create } from 'zustand';
import type { User, Transaction, Project, LangCode, Page } from './types';
import {
  getUsers, saveUsers, getTransactions, saveTransactions,
  getProjects, saveProjects, getCurrentUser, setCurrentUser,
  clearCurrentUser, getSavedLanguage, setSavedLanguage,
  uid, generateAccountNumber,
} from './utils';
import { LANGS } from './constants/langs';

interface State {
  page: Page;
  language: LangCode;
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  projects: Project[];

  // Amira voice state
  amiraText: string;
  isListening: boolean;
  isSpeaking: boolean;

  // Navigation
  navigate: (page: Page) => void;

  // Language
  setLanguage: (lang: LangCode) => void;

  // Auth
  register: (data: Omit<User, 'id' | 'accountNumber' | 'balance' | 'createdAt'>) => User;
  login: (phone: string, pin: string) => User | null;
  logout: () => void;
  loadSession: () => void;

  // Wallet
  addMoney: (amount: number, description?: string) => void;
  sendMoney: (toPhone: string, amount: number, type: 'standard' | 'protected') => boolean;

  // Projects
  createProject: (data: Omit<Project, 'id' | 'userId' | 'status' | 'createdAt'>) => void;

  // Amira
  setAmiraText: (text: string) => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
}

export const useStore = create<State>((set, get) => ({
  page: 'welcome',
  language: (getSavedLanguage() as LangCode) || 'en',
  users: getUsers(),
  currentUser: null,
  transactions: getTransactions(),
  projects: getProjects(),

  amiraText: '',
  isListening: false,
  isSpeaking: false,

  navigate: (page) => set({ page }),

  setLanguage: (language) => {
    setSavedLanguage(language);
    set({ language });
  },

  register: (data) => {
    const users = get().users;
    const accountNumber = generateAccountNumber(data.phone);
    const user: User = {
      ...data,
      id: uid(),
      accountNumber,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    const next = [...users, user];
    saveUsers(next);
    setCurrentUser(user.phone);
    set({ users: next, currentUser: user });
    return user;
  },

  login: (phone, pin) => {
    const users = get().users;
    const normalizedPhone = phone.replace(/\s/g, '');
    const user = users.find(
      u => u.phone.replace(/\s/g, '') === normalizedPhone && u.pin === pin
    );
    if (user) {
      setCurrentUser(user.phone);
      const userTransactions = getTransactions().filter(t => t.userId === user.id);
      const userProjects = getProjects().filter(p => p.userId === user.id);
      set({ currentUser: user, transactions: userTransactions, projects: userProjects });
      return user;
    }
    return null;
  },

  logout: () => {
    clearCurrentUser();
    set({ currentUser: null, transactions: [], projects: [], page: 'welcome' });
  },

  loadSession: () => {
    const phone = getCurrentUser();
    if (!phone) return;
    const users = getUsers();
    const user = users.find(u => u.phone === phone);
    if (user) {
      const txns = getTransactions().filter(t => t.userId === user.id);
      const projs = getProjects().filter(p => p.userId === user.id);
      set({ currentUser: user, users, transactions: txns, projects: projs, page: 'dashboard' });
    }
  },

  addMoney: (amount, description = 'Account funded') => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updatedUser: User = { ...currentUser, balance: currentUser.balance + amount };
    const allUsers = get().users.map(u => u.id === currentUser.id ? updatedUser : u);
    saveUsers(allUsers);

    const txn: Transaction = {
      id: uid(),
      userId: currentUser.id,
      type: 'credit',
      amount,
      description,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
    const allTxns = [...getTransactions(), txn];
    saveTransactions(allTxns);

    set({
      currentUser: updatedUser,
      users: allUsers,
      transactions: allTxns.filter(t => t.userId === currentUser.id),
    });
  },

  sendMoney: (toPhone, amount, type) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    if (currentUser.balance < amount) return false;

    const allUsers = getUsers();
    const recipient = allUsers.find(u => u.phone.replace(/\s/g, '') === toPhone.replace(/\s/g, ''));

    const status = type === 'protected' ? 'pending' : 'completed';

    // Debit sender
    const updatedSender: User = { ...currentUser, balance: currentUser.balance - amount };
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id) return updatedSender;
      if (recipient && u.id === recipient.id && type === 'standard') {
        return { ...u, balance: u.balance + amount };
      }
      return u;
    });
    saveUsers(updatedUsers);

    // Record transaction
    const allTxns = getTransactions();
    const senderTxn: Transaction = {
      id: uid(),
      userId: currentUser.id,
      type: 'debit',
      transferType: type,
      amount,
      description: type === 'protected' ? 'Protected Payment' : 'Transfer',
      recipientPhone: toPhone,
      recipientName: recipient?.fullName || 'External Account',
      status,
      timestamp: new Date().toISOString(),
    };
    const nextTxns = [...allTxns, senderTxn];

    if (recipient && type === 'standard') {
      const recipientTxn: Transaction = {
        id: uid(),
        userId: recipient.id,
        type: 'credit',
        amount,
        description: `Transfer from ${currentUser.fullName}`,
        recipientPhone: currentUser.phone,
        recipientName: currentUser.fullName,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };
      nextTxns.push(recipientTxn);
    }

    saveTransactions(nextTxns);

    set({
      currentUser: updatedSender,
      users: updatedUsers,
      transactions: nextTxns.filter(t => t.userId === currentUser.id),
    });

    return true;
  },

  createProject: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const project: Project = {
      ...data,
      id: uid(),
      userId: currentUser.id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    const all = [...getProjects(), project];
    saveProjects(all);
    set({ projects: all.filter(p => p.userId === currentUser.id) });
  },

  setAmiraText: (amiraText) => set({ amiraText }),
  setListening: (isListening) => set({ isListening }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
}));

// Selector helpers
export const useLang = () => {
  const lang = useStore(s => s.language);
  return LANGS[lang];
};
