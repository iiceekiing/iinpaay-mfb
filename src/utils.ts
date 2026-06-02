import type { User, Transaction, Project } from './types';

// ── Storage keys ──────────────────────────────────────────────
const KEYS = {
  users:       'iinpaay_users',
  currentUser: 'iinpaay_current',
  transactions:'iinpaay_transactions',
  projects:    'iinpaay_projects',
  language:    'iinpaay_language',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── User persistence ──────────────────────────────────────────
export function getUsers(): User[]       { return load<User[]>(KEYS.users, []); }
export function saveUsers(u: User[])     { save(KEYS.users, u); }
export function getCurrentUser(): string | null { return localStorage.getItem(KEYS.currentUser); }
export function setCurrentUser(phone: string)   { localStorage.setItem(KEYS.currentUser, phone); }
export function clearCurrentUser()              { localStorage.removeItem(KEYS.currentUser); }

// ── Transactions ──────────────────────────────────────────────
export function getTransactions(): Transaction[] { return load<Transaction[]>(KEYS.transactions, []); }
export function saveTransactions(t: Transaction[]) { save(KEYS.transactions, t); }

// ── Projects ──────────────────────────────────────────────────
export function getProjects(): Project[] { return load<Project[]>(KEYS.projects, []); }
export function saveProjects(p: Project[]) { save(KEYS.projects, p); }

// ── Language ──────────────────────────────────────────────────
export function getSavedLanguage(): string | null { return localStorage.getItem(KEYS.language); }
export function setSavedLanguage(lang: string)    { localStorage.setItem(KEYS.language, lang); }

// ── Account number generator ──────────────────────────────────
export function generateAccountNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const suffix = digits.slice(-7).padStart(7, '0');
  const prefix = String(Math.floor(Math.random() * 90) + 10);
  const mid    = String(Math.floor(Math.random() * 9) + 1);
  return `${prefix}${mid}${suffix}`.slice(0, 10);
}

// ── Generate unique ID ────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Format naira ──────────────────────────────────────────────
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Format date ───────────────────────────────────────────────
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

// ── Month name → number ───────────────────────────────────────
const MONTHS: Record<string, number> = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
};

export function parseMonth(input: string): number | null {
  const n = parseInt(input, 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return n;
  const key = input.toLowerCase().trim();
  return MONTHS[key] ?? null;
}

// ── Parse speech-to-number ────────────────────────────────────
const WORD_NUMS: Record<string, number> = {
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
  seventeen:17, eighteen:18, nineteen:19, twenty:20,
  'twenty one':21,'twenty two':22,'twenty three':23,'twenty four':24,'twenty five':25,
  'twenty six':26,'twenty seven':27,'twenty eight':28,'twenty nine':29, thirty:30,
  'thirty one':31,
};

export function parseNumberFromSpeech(text: string): number | null {
  const trimmed = text.toLowerCase().trim();
  const direct = parseInt(trimmed.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(direct) && direct > 0) return direct;
  return WORD_NUMS[trimmed] ?? null;
}

export function parseAmountFromSpeech(text: string): number | null {
  const clean = text.toLowerCase()
    .replace(/naira|₦|,/gi, '')
    .replace(/thousand/g, '000')
    .replace(/hundred/g, '00')
    .trim();
  const n = parseFloat(clean.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}
