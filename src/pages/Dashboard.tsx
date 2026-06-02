import { useEffect, useState } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { BottomNav } from '../components/ui/BottomNav';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { MicButton } from '../components/amira/MicButton';
import { formatNaira, formatDate, formatTime } from '../utils';
import type { Transaction } from '../types';

function TxnRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.type === 'credit';
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: isCredit ? '#D6F5EA' : txn.transferType === 'protected' ? 'rgba(245,166,35,0.15)' : 'rgba(255,71,87,0.1)' }}>
        <span>{isCredit ? '↙' : txn.transferType === 'protected' ? '🛡' : '↗'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-primary truncate">{txn.description}</p>
        <p className="text-xs text-ink-muted">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</p>
        {txn.status === 'pending' && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,166,35,0.15)', color: '#92600A' }}>Pending</span>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold"
           style={{ color: isCredit ? '#009962' : txn.transferType === 'protected' ? '#92600A' : '#FF4757' }}>
          {isCredit ? '+' : '-'}{formatNaira(txn.amount)}
        </p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const user         = useStore(s => s.currentUser);
  const transactions = useStore(s => s.transactions);
  const logout       = useStore(s => s.logout);
  const navigate     = useStore(s => s.navigate);
  const L            = useLang();
  const { speak }    = useAmira();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showAmira, setShowAmira] = useState(false);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        speak(L.dash_greeting(user.fullName.split(' ')[0] ?? user.fullName));
        setShowAmira(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) { navigate('welcome'); return null; }

  const recentTxns = transactions.slice().reverse().slice(0, 5);
  const firstName  = user.fullName.split(' ')[0] ?? user.fullName;

  const quickActions = [
    { icon: '📤', label: 'Send Money', page: 'send' as const, bg: '#FF6B35', color: '#fff' },
    { icon: '➕', label: 'Add Money',  page: 'add' as const,  bg: '#00C27C', color: '#fff' },
    { icon: '💼', label: 'Projects',   page: 'projects' as const, bg: '#1A3C8F', color: '#fff' },
    { icon: '📋', label: 'History',    page: 'history' as const, bg: '#F5A623', color: '#fff' },
  ];

  return (
    <div className="phone-frame bg-surface-light">
      {/* ── Top section ── */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3C8F 100%)' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-12 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                 style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E' }}>
              {firstName[0]}
            </div>
            <div>
              <p className="text-white/60 text-xs">Good day,</p>
              <p className="text-white font-bold text-sm">{firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MicButton onClick={() => { setShowAmira(v => !v); if (!showAmira) speak(L.dash_guide); }} size="sm" />
            <button onClick={logout} className="text-white/50 text-xs px-2">Out</button>
          </div>
        </div>

        {/* Amira bubble */}
        {showAmira && (
          <div className="px-4 pb-2 animate-fade-in">
            <AmiraBubble compact />
          </div>
        )}

        {/* Balance card */}
        <div className="mx-4 mb-4 rounded-2xl p-5"
             style={{ background: 'rgba(0,194,124,0.12)', border: '1px solid rgba(0,194,124,0.25)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-brand-accent text-xs">🛡</span>
              <span className="text-white/70 text-xs font-medium">{L.dash_balance}</span>
            </div>
            <button onClick={() => setBalanceVisible(v => !v)} className="text-white/50 text-lg">
              {balanceVisible ? '👁' : '👁‍🗨'}
            </button>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {balanceVisible ? formatNaira(user.balance) : '₦ ••••••'}
            </span>
            <button
              onClick={() => navigate('add')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all active:scale-95"
              style={{ background: '#00C27C', color: '#0D1B3E' }}
            >
              + Add Money
            </button>
          </div>
          {/* Account number */}
          <div className="flex items-center gap-2 mt-3 pt-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white/50 text-xs">Account:</span>
            <span className="text-white/80 text-xs font-mono font-semibold tracking-widest">{user.accountNumber}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="scroll-area">
        {/* Quick actions */}
        <div className="px-4 pt-5 pb-4">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(a => (
              <button
                key={a.page}
                onClick={() => { navigate(a.page); speak(a.page === 'send' ? L.dash_send_guide : L.dash_add_guide); }}
                className="flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
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

        {/* Protected payments notice */}
        {transactions.some(t => t.status === 'pending') && (
          <div className="mx-4 mb-4 p-4 rounded-2xl animate-fade-in"
               style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡</span>
              <span className="text-sm font-bold" style={{ color: '#92600A' }}>Protected Payments</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#F5A623', color: '#fff' }}>
                {transactions.filter(t => t.status === 'pending').length}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#92600A' }}>You have pending protected payments.</p>
          </div>
        )}

        {/* Recent transactions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Transaction History</p>
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
                <button onClick={() => navigate('add')}
                        className="mt-3 text-sm font-semibold"
                        style={{ color: '#00C27C' }}>
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
