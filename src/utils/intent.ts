export type Intent =
  | 'REGISTER'
  | 'LOGIN'
  | 'ADD_MONEY'
  | 'SEND_MONEY'
  | 'CREATE_PROJECT'
  | 'DASHBOARD'
  | 'HISTORY'
  | 'PROJECTS'
  | 'PROFILE'
  | 'YES'
  | 'NO'
  | 'HELP'
  | 'UNKNOWN';

// Keyword patterns per intent — order matters, more specific first
const PATTERNS: [Intent, string[]][] = [
  ['ADD_MONEY',       ['add money', 'fund my account', 'deposit', 'top up', 'add funds', 'put money', 'load money']],
  ['SEND_MONEY',      ['send money', 'transfer money', 'pay someone', 'send funds', 'transfer funds', 'remit', 'i want to send', 'i want to transfer']],
  ['CREATE_PROJECT',  ['create project', 'new project', 'start project', 'open project', 'create a project']],
  ['HISTORY',         ['transaction history', 'my history', 'statement', 'past transactions', 'transaction']],
  ['PROJECTS',        ['my projects', 'show projects', 'view projects', 'open projects']],
  ['PROFILE',         ['profile', 'my account details', 'settings', 'my profile']],
  ['DASHBOARD',       ['home', 'dashboard', 'go home', 'back to dashboard']],
  ['REGISTER',        ['register', 'create account', 'sign up', 'new account', 'open account', 'help me create']],
  ['LOGIN',           ['login', 'log in', 'sign in', 'access my account', 'i have an account']],
  ['YES',             ['yes', 'yeah', 'yep', 'sure', 'correct', 'ok', 'okay', 'right', 'confirm',
                       'eh', 'ee', 'bẹ́ẹ̀ ni', 'oo', 'affirmative', 'go ahead']],
  ['NO',              ["no", "nope", "nah", "negative", "don't", "not really", "i don't",
                       "a'a", "mba", "bẹ́ẹ̀ kọ", "i don't have", "i haven't"]],
  ['HELP',            ['help', 'assist', 'guide me', 'i need help', 'what can you do']],
];

export function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();

  for (const [intent, patterns] of PATTERNS) {
    if (patterns.some(p => lower.includes(p))) return intent;
  }

  // Single-word fallbacks
  if (/^(yes|yeah|yep|sure|ok|eh|ee|bẹ́ẹ̀)$/i.test(lower)) return 'YES';
  if (/^(no|nope|nah|a'a|mba)$/i.test(lower)) return 'NO';

  return 'UNKNOWN';
}

/** Extract a number from spoken text ("fifty thousand" → 50000, "5000" → 5000) */
export function extractAmount(text: string): number | null {
  const clean = text.toLowerCase()
    .replace(/naira/gi, '')
    .replace(/thousand/g, '000')
    .replace(/hundred/g, '00')
    .replace(/,/g, '')
    .trim();
  const n = parseFloat(clean.replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
}

/** Normalize a phone number from speech ("zero eight zero three..." → "08031234567") */
export function extractPhone(text: string): string | null {
  const digits = text.replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

/** Detect whether a response is affirmative */
export function isYes(text: string): boolean {
  return detectIntent(text) === 'YES';
}

/** Detect whether a response is negative */
export function isNo(text: string): boolean {
  return detectIntent(text) === 'NO';
}
