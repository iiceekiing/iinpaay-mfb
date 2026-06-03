import { useEffect, useState } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { BottomNav } from '../components/ui/BottomNav';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { formatNaira, formatDate, formatTime } from '../utils';
import { detectIntent } from '../utils/intent';
import type { Transaction, Page } from '../types';

function TxnRow({ txn }: { txn: Transaction }) {
  const isCredit  = txn.type === 'credit';
  const isPending = txn.status === 'pending';
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0"
           style={{ background: isCredit ? '#D6F5EA' : isPending ? 'rgba(245,166,35,0.15)' : 'rgba(255,107,53,0.1)' }}>
        {isCredit ? '↙' : isPending ? '🛡' : '↗'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-primary truncate">{txn.description}</p>
        <p className="text-xs text-ink-muted">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</p>
        {isPending && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,166,35,0.15)', color: '#92600A' }}>Pending</span>
        )}
      </div>
      <p className="text-sm font-bold flex-shrink-0"
         style={{ color: isCredit ? '#009962' : isPending ? '#92600A' : '#FF4757' }}>
        {isCredit ? '+' : '-'}{formatNaira(txn.amount)}
      </p>
    </div>
  );
}

const INTENT_ROUTES: Partial<Record<ReturnType<typeof detectIntent>, Page>> = {
  ADD_MONEY:      'add',
  SEND_MONEY:     'send',
  CREATE_PROJECT: 'projects',
  HISTORY:        'history',
  PROJECTS:       'projects',
  PROFILE:        'profile',
};

export function Dashboard() {
  const user           = useStore(s => s.currentUser);
  const transactions   = useStore(s => s.transactions);
  const logout         = useStore(s => s.logout);
  const navigate       = useStore(s => s.navigate);
  const setAmiraText   = useStore(s => s.setAmiraText);
  const amiraDismissed = useStore(s => s.amiraDismissed);
  const dismissAmira   = useStore(s => s.dismissAmira);
  const restoreAmira   = useStore(s => s.restoreAmira);
  const voiceEnabled   = useStore(s => s.voiceEnabled);
  const L              = useLang();
  const { speak, activateListen, stopSpeaking } = useAmira();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [greeted, setGreeted]               = useState(false);
  const [commandActive, setCommandActive]   = useState(false);

  // ── Set greeting text on first load (visual only, no auto-speak) ──
  useEffect(() => {
    if (!user || greeted) return;
    setGreeted(true);
    const firstName = user.fullName.split(' ')[0] ?? user.fullName;
    setAmiraText(L.dash_greeting(firstName));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Ask Amira — user-initiated global command ────────────────
  const handleMicClick = async () => {
    if (commandActive) { stopSpeaking(); setCommandActive(false); return; }
    if (amiraDismissed) { restoreAmira(); return; }

    setCommandActive(true);

    // Show the guidance text immediately
    setAmiraText(L.dash_guide);

    // If voice is enabled, speak then listen; otherwise just listen (text mode)
    let resp: string | null = null;
    if (voiceEnabled) {
      await speak(L.dash_guide);
      resp = await activateListen(10000);
    } else {
      // Voice is off — show the prompt text, listening is the only interaction
      resp = await activateListen(10000);
    }

    setCommandActive(false);

    if (!resp) return;

    const intent    = detectIntent(resp);
    const targetPage = INTENT_ROUTES[intent];

    if (targetPage) {
      const confirmMsg =
        intent === 'ADD_MONEY'  ? L.dash_add_guide :
        intent === 'SEND_MONEY' ? L.dash_send_guide :
        `Going to ${targetPage}.`;
      setAmiraText(confirmMsg);
      if (voiceEnabled) await speak(confirmMsg);
      navigate(targetPage);
    } else {
      const retryMsg = L.not_understood + ' ' + L.dash_guide;
      setAmiraText(retryMsg);
      if (voiceEnabled) speak(retryMsg);
    }
  };

  if (!user) { navigate('welcome'); return null; }

  const recentTxns = transactions.slice().reverse().slice(0, 5);
  const firstName  = user.fullName.split(' ')[0] ?? user.fullName;

  const quickActions = [
    { icon: '📤', label: 'Send Money',  page: 'send'     as Page, bg: '#FF6B35' },
    { icon: '➕', label: 'Add Money',   page: 'add'      as Page, bg: '#00C27C' },
    { icon: '💼', label: 'Projects',    page: 'projects' as Page, bg: '#1A3C8F' },
    { icon: '📋', label: 'History',     page: 'history'  as Page, bg: '#F5A623' },
  ];

  return (
    <div className="phone-frame bg-surface-light">
      {/* ── Top section ── */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3C8F 100%)' }}>
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                 style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E' }}>
              {firstName[0]}
            </div>
            <div>
              <p className="text-white/45 text-[11px]">Good day,</p>
              <p className="text-white font-bold text-sm">{firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {amiraDismissed ? (
              <AmiraReopenButton onReopen={restoreAmira} />
            ) : (
              <MicButton
                onClick={handleMicClick}
                onDismiss={dismissAmira}
                size="sm"
                label="Ask Amira"
              />
            )}
            <button onClick={logout} className="text-white/35 text-[11px] px-1.5">Out</button>
          </div>
        </div>

        {/* Amira bubble — always shows text guidance, voice is optional */}
        {!amiraDismissed && (
          <div className="px-4 pb-1 min-h-[1px]">
            <AmiraBubble compact />
          </div>
        )}

        {/* Balance card */}
        <div className="mx-4 mb-4 rounded-2xl p-5"
             style={{ background: 'rgba(0,194,124,0.1)', border: '1px solid rgba(0,194,124,0.22)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-brand-accent text-xs">🛡</span>
              <span className="text-white/60 text-xs font-medium">{L.dash_balance}</span>
            </div>
            <button onClick={() => setBalanceVisible(v => !v)} className="text-white/40 text-base">
              {balanceVisible ? '👁' : '👁‍🗨'}
            </button>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {balanceVisible ? formatNaira(user.balance) : '₦ ••••••'}
            </span>
            <button onClick={() => navigate('add')}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs transition-all active:scale-95"
                    style={{ background: '#00C27C', color: '#0D1B3E' }}>
              + Add
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-white/40 text-xs">Account</span>
            <span className="text-white/70 text-xs font-mono font-semibold tracking-widest">{user.accountNumber}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="scroll-area">
        {/* Quick actions */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(a => (
              <button key={a.page} onClick={() => navigate(a.page)}
                      className="flex flex-col items-center gap-1.5 transition-all active:scale-95">
                <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl shadow-sm"
                     style={{ background: a.bg }}>
                  {a.icon}
                </div>
                <span className="text-[10px] font-semibold text-ink-secondary text-center leading-tight">
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Protected payments */}
        {transactions.some(t => t.status === 'pending') && (
          <div className="mx-4 mb-3 p-3.5 rounded-2xl animate-fade-in"
               style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.28)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡</span>
              <span className="text-sm font-bold" style={{ color: '#92600A' }}>Protected Payments</span>
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#F5A623', color: '#fff' }}>
                {transactions.filter(t => t.status === 'pending').length}
              </span>
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Recent</p>
            {transactions.length > 5 && (
              <button onClick={() => navigate('history')} className="text-xs font-semibold" style={{ color: '#1A3C8F' }}>
                See all →
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl px-4 card">
            {recentTxns.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-4xl mb-3 block">💳</span>
                <p className="text-sm text-ink-muted">No transactions yet.</p>
                <button onClick={() => navigate('add')} className="mt-3 text-sm font-semibold" style={{ color: '#00C27C' }}>
                  Add money to get started →
                </button>
              </div>
            ) : (
              recentTxns.map(t => <TxnRow key={t.id} txn={t} />)
            )}
          </div>
        </div>
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}
