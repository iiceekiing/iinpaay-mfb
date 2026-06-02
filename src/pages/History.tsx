import { useStore } from '../store';
import { BottomNav } from '../components/ui/BottomNav';
import { formatNaira, formatDate, formatTime } from '../utils';
import type { Transaction } from '../types';

function TxnCard({ txn }: { txn: Transaction }) {
  const isCredit = txn.type === 'credit';
  const isPending = txn.status === 'pending';

  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
           style={{
             background: isCredit ? '#D6F5EA' : isPending ? 'rgba(245,166,35,0.15)' : 'rgba(255,107,53,0.1)',
           }}>
        {isCredit ? '↙' : isPending ? '🛡' : '↗'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-primary truncate">{txn.description}</p>
        {(txn.recipientName && txn.recipientName !== 'External Account') && (
          <p className="text-xs text-ink-muted truncate">{isCredit ? 'From' : 'To'}: {txn.recipientName}</p>
        )}
        <p className="text-xs text-ink-muted">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold"
           style={{ color: isCredit ? '#009962' : isPending ? '#92600A' : '#FF4757' }}>
          {isCredit ? '+' : '-'}{formatNaira(txn.amount)}
        </p>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: isPending ? 'rgba(245,166,35,0.15)' : isCredit ? '#D6F5EA' : 'rgba(255,107,53,0.1)',
                color: isPending ? '#92600A' : isCredit ? '#009962' : '#CC3311',
              }}>
          {isPending ? 'Pending' : 'Done'}
        </span>
      </div>
    </div>
  );
}

export function History() {
  const transactions = useStore(s => s.transactions);
  const reversed     = transactions.slice().reverse();

  const totals = transactions.reduce((acc, t) => ({
    in:  acc.in  + (t.type === 'credit' ? t.amount : 0),
    out: acc.out + (t.type === 'debit'  ? t.amount : 0),
  }), { in: 0, out: 0 });

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-white font-bold text-xl mb-4">Transaction History</h1>
          {/* Summary cards */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background: 'rgba(0,194,124,0.12)', border: '1px solid rgba(0,194,124,0.25)' }}>
              <p className="text-white/60 text-xs mb-1">Total In</p>
              <p className="text-white font-bold">{formatNaira(totals.in)}</p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)' }}>
              <p className="text-white/60 text-xs mb-1">Total Out</p>
              <p className="text-white font-bold">{formatNaira(totals.out)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-area">
        <div className="mx-4 mt-4 bg-white rounded-2xl card overflow-hidden">
          {reversed.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-5xl mb-4 block">📋</span>
              <p className="text-sm text-ink-muted">No transactions yet.</p>
            </div>
          ) : (
            reversed.map(t => <TxnCard key={t.id} txn={t} />)
          )}
        </div>
        <div className="h-6" />
      </div>

      <BottomNav />
    </div>
  );
}
