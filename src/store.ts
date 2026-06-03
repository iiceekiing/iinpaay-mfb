import { create } from 'zustand';
import type { User, Transaction, Project, Complaint, LangCode, Page } from './types';
import {
  getUsers, saveUsers, getTransactions, saveTransactions,
  getProjects, saveProjects, getComplaints, saveComplaints,
  getCurrentUser, setCurrentUser, clearCurrentUser,
  getSavedLanguage, setSavedLanguage,
  uid, generateAccountNumber,
} from './utils';
import { LANGS } from './constants/langs';

// ── Voice preference persistence ─────────────────────────────
function loadVoiceEnabled(): boolean {
  try { return localStorage.getItem('iinpaay_voice') !== 'off'; } catch { return true; }
}
function saveVoiceEnabled(v: boolean) {
  try { localStorage.setItem('iinpaay_voice', v ? 'on' : 'off'); } catch { /* ignore */ }
}
function loadVoiceGuideEnabled(): boolean {
  try { return localStorage.getItem('iinpaay_voice_guide') !== 'off'; } catch { return true; }
}
function saveVoiceGuideEnabled(v: boolean) {
  try { localStorage.setItem('iinpaay_voice_guide', v ? 'on' : 'off'); } catch { /* ignore */ }
}

interface State {
  page: Page;
  language: LangCode;
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  projects: Project[];
  complaints: Complaint[];

  // Amira voice state
  amiraText:         string;
  transcript:        string;
  isListening:       boolean;
  isSpeaking:        boolean;
  isProcessing:      boolean;
  amiraDismissed:    boolean;
  voiceEnabled:      boolean;  // Amira voice on/off
  voiceGuideEnabled: boolean;  // VoiceGuide on/off

  // Navigation
  navigate: (page: Page) => void;

  // Language
  setLanguage: (lang: LangCode) => void;

  // Auth
  register: (data: Omit<User, 'id' | 'accountNumber' | 'balance' | 'createdAt'>) => User;
  login: (phone: string, pin: string) => User | null;
  logout: () => void;
  loadSession: () => void;
  refreshCurrentUser: () => void;

  // Wallet
  addMoney: (amount: number, description?: string) => void;
  sendMoney: (toPhone: string, amount: number, type: 'standard' | 'protected') => boolean;

  // Pay Upfront
  createPayUpfront: (data: {
    title: string;
    description?: string;
    totalAmount: number;
    upfrontAmount: number;
    recipientPhone: string;
    recipientName: string;
    deadline: string;
  }) => { success: boolean; error?: string };
  releasePayment: (projectId: string) => boolean;
  refundPayment:  (projectId: string) => boolean;

  // Complaints
  submitComplaint: (data: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => void;

  // Amira
  setAmiraText:       (text: string) => void;
  setTranscript:      (text: string) => void;
  setListening:       (v: boolean) => void;
  setSpeaking:        (v: boolean) => void;
  setProcessing:      (v: boolean) => void;
  dismissAmira:       () => void;
  restoreAmira:       () => void;
  setVoiceEnabled:    (v: boolean) => void;
  toggleVoice:        () => void;
  setVoiceGuideEnabled: (v: boolean) => void;
  toggleVoiceGuide:   () => void;
}

export const useStore = create<State>((set, get) => ({
  page:     'welcome',
  language: (getSavedLanguage() as LangCode) || 'en',
  users:    getUsers(),
  currentUser: null,
  transactions: getTransactions(),
  projects: getProjects(),
  complaints: getComplaints(),

  amiraText:         '',
  transcript:        '',
  isListening:       false,
  isSpeaking:        false,
  isProcessing:      false,
  amiraDismissed:    false,
  voiceEnabled:      loadVoiceEnabled(),
  voiceGuideEnabled: loadVoiceGuideEnabled(),

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
    const allUsers = getUsers();
    const normalized = phone.replace(/\s/g, '');
    const user = allUsers.find(
      u => u.phone.replace(/\s/g, '') === normalized && u.pin === pin
    );
    if (user) {
      setCurrentUser(user.phone);
      // Load ALL transactions where this user is sender or receiver
      const allTxns = getTransactions();
      const userTxns = allTxns.filter(t => t.userId === user.id);
      const allProjects = getProjects();
      const userProjects = allProjects.filter(p => p.userId === user.id);
      const userComplaints = getComplaints().filter(c => c.userId === user.id);
      set({
        currentUser: user,
        users: allUsers,
        transactions: userTxns,
        projects: userProjects,
        complaints: userComplaints,
      });
      return user;
    }
    return null;
  },

  logout: () => {
    clearCurrentUser();
    set({ currentUser: null, transactions: [], projects: [], complaints: [], page: 'welcome' });
  },

  loadSession: () => {
    const phone = getCurrentUser();
    if (!phone) return;
    const allUsers = getUsers();
    const user = allUsers.find(u => u.phone === phone);
    if (user) {
      const allTxns = getTransactions();
      const userTxns  = allTxns.filter(t => t.userId === user.id);
      const userProjs = getProjects().filter(p => p.userId === user.id);
      const userCompl = getComplaints().filter(c => c.userId === user.id);
      set({
        currentUser: user,
        users: allUsers,
        transactions: userTxns,
        projects: userProjs,
        complaints: userCompl,
        page: 'dashboard',
      });
    }
  },

  // Re-read current user's balance from localStorage (after external updates)
  refreshCurrentUser: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const allUsers = getUsers();
    const updated = allUsers.find(u => u.id === currentUser.id);
    if (updated) {
      const allTxns = getTransactions();
      const userTxns = allTxns.filter(t => t.userId === updated.id);
      const userProjs = getProjects().filter(p => p.userId === updated.id);
      const userCompl = getComplaints().filter(c => c.userId === updated.id);
      set({
        currentUser: updated,
        users: allUsers,
        transactions: userTxns,
        projects: userProjs,
        complaints: userCompl,
      });
    }
  },

  addMoney: (amount, description = 'Account funded') => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, balance: currentUser.balance + amount };
    const allUsers = get().users.map(u => u.id === currentUser.id ? updatedUser : u);
    saveUsers(allUsers);
    const txn: Transaction = {
      id: uid(), userId: currentUser.id, type: 'credit',
      amount, description, status: 'completed', timestamp: new Date().toISOString(),
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
    if (!currentUser || currentUser.balance < amount) return false;
    const allUsers = getUsers();
    const recipient = allUsers.find(
      u => u.phone.replace(/\s/g, '') === toPhone.replace(/\s/g, '')
    );
    const status = type === 'protected' ? 'pending' : 'completed';

    const updatedSender: User = { ...currentUser, balance: currentUser.balance - amount };
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id) return updatedSender;
      if (recipient && u.id === recipient.id && type === 'standard')
        return { ...u, balance: u.balance + amount };
      return u;
    });
    saveUsers(updatedUsers);

    const allTxns = getTransactions();
    const senderTxn: Transaction = {
      id: uid(), userId: currentUser.id, type: 'debit', transferType: type,
      amount,
      description: type === 'protected' ? 'Protected Payment' : 'Transfer',
      recipientPhone: toPhone,
      recipientName: recipient?.fullName || 'External Account',
      status,
      timestamp: new Date().toISOString(),
    };
    const nextTxns = [...allTxns, senderTxn];

    // Create recipient credit transaction for both standard and protected
    if (recipient) {
      nextTxns.push({
        id: uid(),
        userId: recipient.id,
        type: 'credit',
        transferType: type,
        amount,
        description: type === 'protected'
          ? `Protected Payment from ${currentUser.fullName}`
          : `Transfer from ${currentUser.fullName}`,
        fromUserId:   currentUser.id,
        fromUserName: currentUser.fullName,
        recipientPhone: currentUser.phone,
        recipientName:  currentUser.fullName,
        status: type === 'protected' ? 'pending' : 'completed',
        timestamp: new Date().toISOString(),
      });
    }

    saveTransactions(nextTxns);
    set({
      currentUser: updatedSender,
      users: updatedUsers,
      transactions: nextTxns.filter(t => t.userId === currentUser.id),
    });
    return true;
  },

  createPayUpfront: ({ title, description, totalAmount, upfrontAmount, recipientPhone, recipientName, deadline }) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: 'Not logged in' };
    if (currentUser.balance < upfrontAmount)
      return { success: false, error: 'Insufficient balance for upfront payment' };
    if (upfrontAmount > totalAmount)
      return { success: false, error: 'Upfront amount cannot exceed total amount' };

    const allUsers = getUsers();
    const recipient = allUsers.find(
      u => u.phone.replace(/\s/g, '') === recipientPhone.replace(/\s/g, '')
    );

    const projectId = uid();
    const now = new Date().toISOString();

    // Deduct from sender
    const updatedSender: User = { ...currentUser, balance: currentUser.balance - upfrontAmount };
    const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updatedSender : u);
    saveUsers(updatedUsers);

    // Sender's debit transaction
    const senderTxnId = uid();
    const senderTxn: Transaction = {
      id: senderTxnId,
      userId: currentUser.id,
      type: 'debit',
      transferType: 'payupfront',
      amount: upfrontAmount,
      description: `Pay Upfront: ${title}`,
      purpose: title,
      recipientPhone,
      recipientName: recipient?.fullName || recipientName,
      projectId,
      status: 'pending',
      timestamp: now,
    };

    // Recipient's pending credit transaction
    const recipientTxnId = uid();
    const recipientTxn: Transaction = {
      id: recipientTxnId,
      userId: recipient ? recipient.id : recipientPhone, // fallback for unknown users
      type: 'credit',
      transferType: 'payupfront',
      amount: upfrontAmount,
      description: `Pay Upfront from ${currentUser.fullName}: ${title}`,
      purpose: title,
      fromUserId:   currentUser.id,
      fromUserName: currentUser.fullName,
      recipientPhone: currentUser.phone,
      recipientName:  currentUser.fullName,
      projectId,
      status: 'pending',
      timestamp: now,
    };

    const allTxns = getTransactions();
    const nextTxns = [...allTxns, senderTxn, recipientTxn];
    saveTransactions(nextTxns);

    // Create project record
    const project: Project = {
      id: projectId,
      userId: currentUser.id,
      title,
      description,
      totalAmount,
      upfrontAmount,
      recipientPhone,
      recipientName: recipient?.fullName || recipientName,
      deadline,
      status: 'active',
      senderTransactionId: senderTxnId,
      recipientTransactionId: recipientTxnId,
      createdAt: now,
    };
    const allProjects = [...getProjects(), project];
    saveProjects(allProjects);

    set({
      currentUser: updatedSender,
      users: updatedUsers,
      transactions: nextTxns.filter(t => t.userId === currentUser.id),
      projects: allProjects.filter(p => p.userId === currentUser.id),
    });
    return { success: true };
  },

  releasePayment: (projectId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allProjects = getProjects();
    const project = allProjects.find(p => p.id === projectId && p.userId === currentUser.id);
    if (!project || project.status !== 'active') return false;

    const allUsers = getUsers();
    const recipient = allUsers.find(
      u => u.phone.replace(/\s/g, '') === project.recipientPhone.replace(/\s/g, '')
    );

    // Update recipient balance
    const updatedUsers = allUsers.map(u => {
      if (recipient && u.id === recipient.id)
        return { ...u, balance: u.balance + project.upfrontAmount };
      return u;
    });
    saveUsers(updatedUsers);

    // Update transactions
    const allTxns = getTransactions();
    const updatedTxns = allTxns.map(t => {
      if (t.id === project.senderTransactionId)
        return { ...t, status: 'released' as const };
      if (t.id === project.recipientTransactionId)
        return { ...t, status: 'completed' as const, description: `Credit Alert: ${project.title} (from ${currentUser.fullName})` };
      return t;
    });
    saveTransactions(updatedTxns);

    // Update project
    const updatedProjects = allProjects.map(p =>
      p.id === projectId ? { ...p, status: 'completed' as const } : p
    );
    saveProjects(updatedProjects);

    set({
      users: updatedUsers,
      transactions: updatedTxns.filter(t => t.userId === currentUser.id),
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
    });
    return true;
  },

  refundPayment: (projectId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allProjects = getProjects();
    const project = allProjects.find(p => p.id === projectId && p.userId === currentUser.id);
    if (!project || project.status !== 'active') return false;

    // Refund to sender
    const allUsers = getUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id)
        return { ...u, balance: u.balance + project.upfrontAmount };
      return u;
    });
    saveUsers(updatedUsers);

    // Update transactions
    const allTxns = getTransactions();
    const updatedTxns = allTxns.map(t => {
      if (t.id === project.senderTransactionId)
        return { ...t, status: 'refunded' as const, description: `Refunded: ${project.title}` };
      if (t.id === project.recipientTransactionId)
        return { ...t, status: 'refunded' as const };
      return t;
    });
    saveTransactions(updatedTxns);

    // Update project
    const updatedProjects = allProjects.map(p =>
      p.id === projectId ? { ...p, status: 'refunded' as const } : p
    );
    saveProjects(updatedProjects);

    const refundedSender = updatedUsers.find(u => u.id === currentUser.id)!;
    set({
      currentUser: refundedSender,
      users: updatedUsers,
      transactions: updatedTxns.filter(t => t.userId === currentUser.id),
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
    });
    return true;
  },

  submitComplaint: (data) => {
    const complaint: Complaint = {
      ...data,
      id: uid(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    const allComplaints = [...getComplaints(), complaint];
    saveComplaints(allComplaints);
    const { currentUser } = get();
    set({ complaints: allComplaints.filter(c => c.userId === currentUser?.id) });
  },

  setAmiraText:    (amiraText)    => set({ amiraText }),
  setTranscript:   (transcript)   => set({ transcript }),
  setListening:    (isListening)  => set({ isListening }),
  setSpeaking:     (isSpeaking)   => set({ isSpeaking }),
  setProcessing:   (isProcessing) => set({ isProcessing }),
  dismissAmira:    () => set({ amiraDismissed: true }),
  restoreAmira:    () => set({ amiraDismissed: false }),
  setVoiceEnabled: (v) => { saveVoiceEnabled(v); set({ voiceEnabled: v }); },
  toggleVoice: () => {
    const next = !get().voiceEnabled;
    saveVoiceEnabled(next);
    if (!next) window.speechSynthesis?.cancel();
    set({ voiceEnabled: next });
  },
  setVoiceGuideEnabled: (v) => { saveVoiceGuideEnabled(v); set({ voiceGuideEnabled: v }); },
  toggleVoiceGuide: () => {
    const next = !get().voiceGuideEnabled;
    saveVoiceGuideEnabled(next);
    if (!next) window.speechSynthesis?.cancel();
    set({ voiceGuideEnabled: next });
  },
}));

// Selector helpers
export const useLang = () => {
  const lang = useStore(s => s.language);
  return LANGS[lang];
};
