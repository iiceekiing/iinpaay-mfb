import { create } from 'zustand';
import type {
  User, Transaction, Project, Complaint,
  RefundRequest, AppNotification,
  LangCode, Page, ProjectStatus, TimelineEvent,
} from './types';
import {
  getUsers, saveUsers, getTransactions, saveTransactions,
  getProjects, saveProjects, getComplaints, saveComplaints,
  getRefundRequests, saveRefundRequests,
  getNotifications, saveNotifications,
  getCurrentUser, setCurrentUser, clearCurrentUser,
  getSavedLanguage, setSavedLanguage,
  uid, generateAccountNumber,
} from './utils';
import { LANGS } from './constants/langs';

// ── Voice preference persistence ─────────────────────────────
function loadVoice(key: string, def: boolean): boolean {
  try { return localStorage.getItem(key) !== (def ? 'off' : 'on'); } catch { return def; }
}
function saveVoice(key: string, v: boolean) {
  try { localStorage.setItem(key, v ? 'on' : 'off'); } catch { /* ignore */ }
}

function makeTimelineEvent(event: string, actor?: string): TimelineEvent {
  return { id: uid(), event, timestamp: new Date().toISOString(), actor };
}

interface State {
  page: Page;
  language: LangCode;
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  projects: Project[];
  complaints: Complaint[];
  refundRequests: RefundRequest[];
  notifications: AppNotification[];

  // For cross-page navigation with context
  selectedProjectId: string | null;

  // Amira voice state
  amiraText:         string;
  transcript:        string;
  isListening:       boolean;
  isSpeaking:        boolean;
  isProcessing:      boolean;
  amiraDismissed:    boolean;
  micPermission:     'granted' | 'denied' | 'prompt' | 'unknown';
  voiceEnabled:      boolean;
  voiceGuideEnabled: boolean;

  // Navigation
  navigate: (page: Page, projectId?: string) => void;

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
    title: string; description?: string; totalAmount: number; upfrontAmount: number;
    recipientPhone: string; recipientName: string; deadline: string;
  }) => { success: boolean; error?: string };
  releasePayment: (projectId: string) => boolean;
  requestRefund:  (projectId: string, reason: string) => boolean;
  respondToRefund:(requestId: string, response: 'accept' | 'contest', message?: string) => boolean;
  refundPayment:  (projectId: string) => boolean;   // direct refund (no dispute)

  // Complaints
  submitComplaint: (data: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => void;

  // Notifications
  markNotificationRead:  (id: string) => void;
  markAllNotificationsRead: () => void;

  // Amira
  setAmiraText:          (text: string) => void;
  setTranscript:         (text: string) => void;
  setListening:          (v: boolean)   => void;
  setSpeaking:           (v: boolean)   => void;
  setProcessing:         (v: boolean)   => void;
  setMicPermission:      (p: State['micPermission']) => void;
  dismissAmira:          () => void;
  restoreAmira:          () => void;
  setVoiceEnabled:       (v: boolean)   => void;
  toggleVoice:           () => void;
  setVoiceGuideEnabled:  (v: boolean)   => void;
  toggleVoiceGuide:      () => void;
}

export const useStore = create<State>((set, get) => ({
  page:     'welcome',
  language: (getSavedLanguage() as LangCode) || 'en',
  users:    getUsers(),
  currentUser: null,
  transactions: getTransactions(),
  projects:  getProjects(),
  complaints: getComplaints(),
  refundRequests: getRefundRequests(),
  notifications:  getNotifications(),
  selectedProjectId: null,

  amiraText:         '',
  transcript:        '',
  isListening:       false,
  isSpeaking:        false,
  isProcessing:      false,
  amiraDismissed:    false,
  micPermission:     'unknown',
  voiceEnabled:      loadVoice('iinpaay_voice', true),
  voiceGuideEnabled: loadVoice('iinpaay_voice_guide', true),

  navigate: (page, projectId) => set({ page, selectedProjectId: projectId ?? null }),

  setLanguage: (language) => { setSavedLanguage(language); set({ language }); },

  register: (data) => {
    const users = get().users;
    const accountNumber = generateAccountNumber(data.phone);
    const user: User = { ...data, id: uid(), accountNumber, balance: 0, createdAt: new Date().toISOString() };
    const next = [...users, user];
    saveUsers(next);
    setCurrentUser(user.phone);
    set({ users: next, currentUser: user });
    return user;
  },

  login: (phone, pin) => {
    const allUsers = getUsers();
    const user = allUsers.find(
      u => u.phone.replace(/\s/g,'') === phone.replace(/\s/g,'') && u.pin === pin
    );
    if (user) {
      setCurrentUser(user.phone);
      const allTxns = getTransactions();
      const userProjs = getProjects().filter(p => p.userId === user.id);
      const userNotes = getNotifications().filter(n => n.userId === user.id);
      const userReqs  = getRefundRequests().filter(
        r => r.requesterId === user.id || r.freelancerUserId === user.id
      );
      set({
        currentUser: user, users: allUsers,
        transactions: allTxns.filter(t => t.userId === user.id),
        projects: userProjs,
        complaints: getComplaints().filter(c => c.userId === user.id),
        refundRequests: userReqs,
        notifications: userNotes,
      });
      return user;
    }
    return null;
  },

  logout: () => {
    clearCurrentUser();
    set({ currentUser: null, transactions: [], projects: [], complaints: [],
          refundRequests: [], notifications: [], page: 'welcome' });
  },

  loadSession: () => {
    const phone = getCurrentUser();
    if (!phone) return;
    const allUsers = getUsers();
    const user = allUsers.find(u => u.phone === phone);
    if (user) {
      const allTxns   = getTransactions();
      const userNotes = getNotifications().filter(n => n.userId === user.id);
      const userReqs  = getRefundRequests().filter(
        r => r.requesterId === user.id || r.freelancerUserId === user.id
      );
      set({
        currentUser: user, users: allUsers,
        transactions: allTxns.filter(t => t.userId === user.id),
        projects: getProjects().filter(p => p.userId === user.id),
        complaints: getComplaints().filter(c => c.userId === user.id),
        refundRequests: userReqs,
        notifications: userNotes,
        page: 'dashboard',
      });
    }
  },

  refreshCurrentUser: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const allUsers = getUsers();
    const updated  = allUsers.find(u => u.id === currentUser.id);
    if (updated) {
      const allTxns = getTransactions();
      set({
        currentUser: updated, users: allUsers,
        transactions: allTxns.filter(t => t.userId === updated.id),
        projects: getProjects().filter(p => p.userId === updated.id),
        notifications: getNotifications().filter(n => n.userId === updated.id),
        refundRequests: getRefundRequests().filter(
          r => r.requesterId === updated.id || r.freelancerUserId === updated.id
        ),
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
    set({ currentUser: updatedUser, users: allUsers,
          transactions: allTxns.filter(t => t.userId === currentUser.id) });
  },

  sendMoney: (toPhone, amount, type) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.balance < amount) return false;
    const allUsers = getUsers();
    const recipient = allUsers.find(u => u.phone.replace(/\s/g,'') === toPhone.replace(/\s/g,''));
    const status = type === 'protected' ? 'pending' : 'completed';

    const updatedSender: User = { ...currentUser, balance: currentUser.balance - amount };
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id) return updatedSender;
      if (recipient && u.id === recipient.id && type === 'standard') return { ...u, balance: u.balance + amount };
      return u;
    });
    saveUsers(updatedUsers);

    const allTxns = getTransactions();
    const senderTxn: Transaction = {
      id: uid(), userId: currentUser.id, type: 'debit', transferType: type,
      amount, description: type === 'protected' ? 'Protected Payment' : 'Transfer',
      recipientPhone: toPhone, recipientName: recipient?.fullName || 'External Account',
      status, timestamp: new Date().toISOString(),
    };
    const nextTxns = [...allTxns, senderTxn];
    if (recipient) {
      nextTxns.push({
        id: uid(), userId: recipient.id, type: 'credit', transferType: type, amount,
        description: type === 'protected'
          ? `Protected Payment from ${currentUser.fullName}`
          : `Transfer from ${currentUser.fullName}`,
        fromUserId: currentUser.id, fromUserName: currentUser.fullName,
        recipientPhone: currentUser.phone, recipientName: currentUser.fullName,
        status: type === 'protected' ? 'pending' : 'completed',
        timestamp: new Date().toISOString(),
      });
    }
    saveTransactions(nextTxns);
    set({ currentUser: updatedSender, users: updatedUsers,
          transactions: nextTxns.filter(t => t.userId === currentUser.id) });
    return true;
  },

  createPayUpfront: ({ title, description, totalAmount, upfrontAmount, recipientPhone, recipientName, deadline }) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: 'Not logged in' };
    if (currentUser.balance < upfrontAmount) return { success: false, error: 'Insufficient balance' };
    if (upfrontAmount > totalAmount) return { success: false, error: 'Upfront cannot exceed total' };

    const allUsers  = getUsers();
    const recipient = allUsers.find(u => u.phone.replace(/\s/g,'') === recipientPhone.replace(/\s/g,''));
    const projectId = uid();
    const now       = new Date().toISOString();

    const updatedSender: User = { ...currentUser, balance: currentUser.balance - upfrontAmount };
    saveUsers(allUsers.map(u => u.id === currentUser.id ? updatedSender : u));

    const senderTxnId = uid();
    const recipientTxnId = uid();

    const senderTxn: Transaction = {
      id: senderTxnId, userId: currentUser.id, type: 'debit', transferType: 'payupfront',
      amount: upfrontAmount, description: `Pay Upfront: ${title}`, purpose: title,
      recipientPhone, recipientName: recipient?.fullName || recipientName,
      projectId, status: 'pending', timestamp: now,
    };
    const recipientTxn: Transaction = {
      id: recipientTxnId,
      userId: recipient ? recipient.id : recipientPhone,
      type: 'credit', transferType: 'payupfront',
      amount: upfrontAmount,
      description: `Pay Upfront from ${currentUser.fullName}: ${title}`,
      purpose: title, fromUserId: currentUser.id, fromUserName: currentUser.fullName,
      recipientPhone: currentUser.phone, recipientName: currentUser.fullName,
      projectId, status: 'pending', timestamp: now,
    };

    const allTxns = [...getTransactions(), senderTxn, recipientTxn];
    saveTransactions(allTxns);

    const timeline: TimelineEvent[] = [
      makeTimelineEvent('Project Created', currentUser.fullName),
      makeTimelineEvent(`Funds Protected — ${formatNairaPlain(upfrontAmount)} held in escrow`, currentUser.fullName),
      makeTimelineEvent(`Freelancer Invited: ${recipient?.fullName || recipientName}`, currentUser.fullName),
    ];

    const project: Project = {
      id: projectId, userId: currentUser.id, title, description, totalAmount, upfrontAmount,
      recipientPhone, recipientName: recipient?.fullName || recipientName,
      recipientUserId: recipient?.id,
      deadline, status: 'active',
      senderTransactionId: senderTxnId, recipientTransactionId: recipientTxnId,
      timeline, createdAt: now,
    };
    const allProjects = [...getProjects(), project];
    saveProjects(allProjects);

    // Notification for recipient
    if (recipient) {
      const note: AppNotification = {
        id: uid(), userId: recipient.id, read: false,
        type: 'info', relatedProjectId: projectId,
        title: 'New Pay Upfront Payment',
        message: `${currentUser.fullName} has sent you a pay-upfront payment of ₦${upfrontAmount.toLocaleString()} for "${title}". Funds are held in escrow until the project is confirmed.`,
        createdAt: now,
      };
      saveNotifications([...getNotifications(), note]);
    }

    set({
      currentUser: updatedSender,
      transactions: allTxns.filter(t => t.userId === currentUser.id),
      projects: allProjects.filter(p => p.userId === currentUser.id),
    });
    return { success: true };
  },

  releasePayment: (projectId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allProjects = getProjects();
    const project = allProjects.find(p => p.id === projectId && p.userId === currentUser.id);
    if (!project || !['active','refund_requested'].includes(project.status)) return false;

    const allUsers  = getUsers();
    const recipient = allUsers.find(u => u.phone.replace(/\s/g,'') === project.recipientPhone.replace(/\s/g,''));
    const now       = new Date().toISOString();

    const updatedUsers = allUsers.map(u => {
      if (recipient && u.id === recipient.id) return { ...u, balance: u.balance + project.upfrontAmount };
      return u;
    });
    saveUsers(updatedUsers);

    const allTxns = getTransactions();
    const updatedTxns = allTxns.map(t => {
      if (t.id === project.senderTransactionId) return { ...t, status: 'released' as const };
      if (t.id === project.recipientTransactionId) return {
        ...t, status: 'completed' as const,
        description: `Credit Alert: ${project.title} (released by ${currentUser.fullName})`,
      };
      return t;
    });
    saveTransactions(updatedTxns);

    const newTimeline: TimelineEvent[] = [
      ...project.timeline,
      makeTimelineEvent('Funds Released — Payment sent to freelancer', currentUser.fullName),
    ];
    const updatedProjects = allProjects.map(p =>
      p.id === projectId ? { ...p, status: 'completed' as ProjectStatus, timeline: newTimeline } : p
    );
    saveProjects(updatedProjects);

    // Notify freelancer
    if (recipient) {
      const note: AppNotification = {
        id: uid(), userId: recipient.id, read: false,
        type: 'payment_released', relatedProjectId: projectId,
        title: 'Payment Released!',
        message: `${currentUser.fullName} has released your payment of ₦${project.upfrontAmount.toLocaleString()} for "${project.title}". The funds are now in your account.`,
        createdAt: now,
      };
      saveNotifications([...getNotifications(), note]);
    }

    set({
      users: updatedUsers,
      transactions: updatedTxns.filter(t => t.userId === currentUser.id),
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
    });
    return true;
  },

  requestRefund: (projectId, reason) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allProjects = getProjects();
    const project = allProjects.find(p => p.id === projectId && p.userId === currentUser.id);
    if (!project || project.status !== 'active') return false;

    const allUsers    = getUsers();
    const freelancer  = allUsers.find(u => u.phone.replace(/\s/g,'') === project.recipientPhone.replace(/\s/g,''));
    const now         = new Date().toISOString();

    const refundReq: RefundRequest = {
      id: uid(), projectId,
      requesterId: currentUser.id, requesterName: currentUser.fullName,
      freelancerPhone: project.recipientPhone,
      freelancerName:  project.recipientName,
      freelancerUserId: freelancer?.id,
      reason, status: 'pending', createdAt: now,
    };
    const allReqs = [...getRefundRequests(), refundReq];
    saveRefundRequests(allReqs);

    const newTimeline: TimelineEvent[] = [
      ...project.timeline,
      makeTimelineEvent('Refund Requested by project owner', currentUser.fullName),
    ];
    const updatedProjects = allProjects.map(p =>
      p.id === projectId ? { ...p, status: 'refund_requested' as ProjectStatus, timeline: newTimeline } : p
    );
    saveProjects(updatedProjects);

    // Notify freelancer
    if (freelancer) {
      const note: AppNotification = {
        id: uid(), userId: freelancer.id, read: false,
        type: 'refund_request',
        relatedProjectId: projectId, relatedRefundId: refundReq.id,
        title: 'Refund Request Initiated',
        message: `${currentUser.fullName} has requested a refund for "${project.title}". The protected funds of ₦${project.upfrontAmount.toLocaleString()} remain locked. Please respond by accepting or contesting this request.`,
        createdAt: now,
      };
      saveNotifications([...getNotifications(), note]);
    }

    set({
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
      refundRequests: allReqs.filter(
        r => r.requesterId === currentUser.id || r.freelancerUserId === currentUser.id
      ),
    });
    return true;
  },

  respondToRefund: (requestId, response, message) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allReqs  = getRefundRequests();
    const req      = allReqs.find(r => r.id === requestId);
    if (!req || req.freelancerUserId !== currentUser.id) return false;

    const now = new Date().toISOString();
    const newStatus = response === 'accept' ? 'accepted' : 'contested';

    const updatedReqs: RefundRequest[] = allReqs.map(r =>
      r.id === requestId ? { ...r, status: newStatus as RefundRequest['status'], freelancerResponse: message, respondedAt: now } : r
    );
    saveRefundRequests(updatedReqs);

    const allProjects = getProjects();
    const project     = allProjects.find(p => p.id === req.projectId);
    if (!project) return false;

    const newProjectStatus: ProjectStatus =
      response === 'accept' ? 'refunded' : 'refund_review_pending';

    const eventLabel = response === 'accept'
      ? 'Freelancer Accepted Refund — funds will be returned to project owner'
      : 'Freelancer Contested Refund — case under review';

    const newTimeline: TimelineEvent[] = [
      ...project.timeline,
      makeTimelineEvent(eventLabel, currentUser.fullName),
    ];

    const allUsers = getUsers();
    let updatedUsers = allUsers;

    if (response === 'accept') {
      // Return funds to requester
      const allTxns = getTransactions();
      const updatedTxns = allTxns.map(t => {
        if (t.id === project.senderTransactionId)
          return { ...t, status: 'refunded' as const, description: `Refunded: ${project.title}` };
        if (t.id === project.recipientTransactionId)
          return { ...t, status: 'refunded' as const };
        return t;
      });
      saveTransactions(updatedTxns);

      updatedUsers = allUsers.map(u => {
        if (u.id === req.requesterId) return { ...u, balance: u.balance + project.upfrontAmount };
        return u;
      });
      saveUsers(updatedUsers);

      // Notify requester
      const note: AppNotification = {
        id: uid(), userId: req.requesterId, read: false,
        type: 'refund_accepted', relatedProjectId: req.projectId,
        title: 'Refund Accepted',
        message: `${currentUser.fullName} has accepted your refund request for "${project.title}". ₦${project.upfrontAmount.toLocaleString()} will be returned to your account.`,
        createdAt: now,
      };
      saveNotifications([...getNotifications(), note]);
    } else {
      // Notify requester of contest
      const note: AppNotification = {
        id: uid(), userId: req.requesterId, read: false,
        type: 'refund_contested', relatedProjectId: req.projectId,
        title: 'Refund Contested',
        message: `${currentUser.fullName} has contested your refund request for "${project.title}". The case is now under review. The protected funds remain locked.`,
        createdAt: now,
      };
      saveNotifications([...getNotifications(), note]);
    }

    const updatedProjects = allProjects.map(p =>
      p.id === req.projectId ? { ...p, status: newProjectStatus, timeline: newTimeline } : p
    );
    saveProjects(updatedProjects);

    set({
      users: updatedUsers,
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
      refundRequests: updatedReqs.filter(
        r => r.requesterId === currentUser.id || r.freelancerUserId === currentUser.id
      ),
      notifications: getNotifications().filter(n => n.userId === currentUser.id),
    });
    return true;
  },

  refundPayment: (projectId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const allProjects = getProjects();
    const project = allProjects.find(p => p.id === projectId && p.userId === currentUser.id);
    if (!project || project.status !== 'active') return false;

    const allUsers = getUsers();
    const updatedUsers = allUsers.map(u =>
      u.id === currentUser.id ? { ...u, balance: u.balance + project.upfrontAmount } : u
    );
    saveUsers(updatedUsers);

    const allTxns = getTransactions();
    const updatedTxns = allTxns.map(t => {
      if (t.id === project.senderTransactionId) return { ...t, status: 'refunded' as const, description: `Refunded: ${project.title}` };
      if (t.id === project.recipientTransactionId) return { ...t, status: 'refunded' as const };
      return t;
    });
    saveTransactions(updatedTxns);

    const newTimeline: TimelineEvent[] = [
      ...project.timeline,
      makeTimelineEvent('Project Cancelled — funds refunded to project owner', currentUser.fullName),
    ];
    const updatedProjects = allProjects.map(p =>
      p.id === projectId ? { ...p, status: 'refunded' as ProjectStatus, timeline: newTimeline } : p
    );
    saveProjects(updatedProjects);

    const refundedSender = updatedUsers.find(u => u.id === currentUser.id)!;
    set({
      currentUser: refundedSender, users: updatedUsers,
      transactions: updatedTxns.filter(t => t.userId === currentUser.id),
      projects: updatedProjects.filter(p => p.userId === currentUser.id),
    });
    return true;
  },

  submitComplaint: (data) => {
    const complaint: Complaint = { ...data, id: uid(), status: 'submitted', createdAt: new Date().toISOString() };
    const all = [...getComplaints(), complaint];
    saveComplaints(all);
    const { currentUser } = get();
    set({ complaints: all.filter(c => c.userId === currentUser?.id) });
  },

  markNotificationRead: (id) => {
    const all = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(all);
    const { currentUser } = get();
    set({ notifications: all.filter(n => n.userId === currentUser?.id) });
  },

  markAllNotificationsRead: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const all = getNotifications().map(n => n.userId === currentUser.id ? { ...n, read: true } : n);
    saveNotifications(all);
    set({ notifications: all.filter(n => n.userId === currentUser.id) });
  },

  setAmiraText:    (amiraText)    => set({ amiraText }),
  setTranscript:   (transcript)   => set({ transcript }),
  setListening:    (isListening)  => set({ isListening }),
  setSpeaking:     (isSpeaking)   => set({ isSpeaking }),
  setProcessing:   (isProcessing) => set({ isProcessing }),
  setMicPermission:(micPermission)=> set({ micPermission }),
  dismissAmira:    () => set({ amiraDismissed: true }),
  restoreAmira:    () => set({ amiraDismissed: false }),
  setVoiceEnabled: (v) => { saveVoice('iinpaay_voice', v); set({ voiceEnabled: v }); },
  toggleVoice: () => {
    const next = !get().voiceEnabled;
    saveVoice('iinpaay_voice', next);
    if (!next) window.speechSynthesis?.cancel();
    set({ voiceEnabled: next });
  },
  setVoiceGuideEnabled: (v) => { saveVoice('iinpaay_voice_guide', v); set({ voiceGuideEnabled: v }); },
  toggleVoiceGuide: () => {
    const next = !get().voiceGuideEnabled;
    saveVoice('iinpaay_voice_guide', next);
    if (!next) window.speechSynthesis?.cancel();
    set({ voiceGuideEnabled: next });
  },
}));

// Selector helpers
export const useLang = () => {
  const lang = useStore(s => s.language);
  return LANGS[lang];
};

// ── Internal helper (used in store closures only) ─────────────
function formatNairaPlain(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0 });
}
