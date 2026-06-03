import { useRef, useState } from 'react';
import { useStore, useLang } from '../store';
import { BottomNav } from '../components/ui/BottomNav';
import { formatNaira, formatDate, formatTime, isToday, getComplaints } from '../utils';
import type { Transaction } from '../types';

// ── Complaint modal ────────────────────────────────────────────
function ComplaintModal({
  txn,
  onClose,
  onSubmit,
}: {
  txn: Transaction;
  onClose: () => void;
  onSubmit: (desc: string, file?: { name: string; type: string; data: string }) => void;
}) {
  const L = useLang();
  const [desc, setDesc]       = useState('');
  const [file, setFile]       = useState<{ name: string; type: string; data: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy]       = useState(false);
  const fileRef               = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError('');
    const MAX_MB = 10;
    if (f.size > MAX_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: f.name, type: f.type, data: reader.result as string });
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!desc.trim()) { setFileError('Please describe your work'); return; }
    setBusy(true);
    onSubmit(desc, file ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end"
         style={{ background: 'rgba(0,0,0,0.55)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-3xl p-6 animate-slide-up"
           style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink-primary text-base">{L.complaint_title}</h2>
          <button onClick={onClose} className="text-ink-muted text-lg font-bold">✕</button>
        </div>

        <div className="mb-3 px-3 py-2 rounded-xl"
             style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
          <p className="text-xs text-ink-secondary font-semibold truncate">{txn.description}</p>
          <p className="text-xs text-ink-muted">{formatNaira(txn.amount)}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
            {L.complaint_desc_label} *
          </label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={L.complaint_desc_prompt}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
            style={{ borderColor: desc ? '#00C27C' : '#CBD3E8', background: '#f8f9fc', color: '#0D1B3E' }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
            {L.complaint_upload_label}
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            style={{ borderColor: file ? '#00C27C' : '#CBD3E8', background: file ? '#f0fdf8' : '#f8f9fc' }}
          >
            {file ? (
              <>
                <span className="text-2xl">{file.type.startsWith('video') ? '🎬' : '🖼️'}</span>
                <p className="text-xs font-semibold text-ink-primary truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-brand-accent">✓ File attached</p>
              </>
            ) : (
              <>
                <span className="text-2xl">📎</span>
                <p className="text-sm font-semibold text-ink-muted">Tap to upload proof</p>
                <p className="text-[10px] text-ink-muted">Image or video (max 10MB)</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFile}
          />
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
          style={{ background: busy ? '#CBD3E8' : 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: busy ? 'none' : '0 4px 18px rgba(0,194,124,0.3)' }}
        >
          {busy ? 'Submitting…' : L.complaint_submit}
        </button>
      </div>
    </div>
  );
}

// ── Transaction card ──────────────────────────────────────────
function TxnCard({ txn, onComplain }: { txn: Transaction; onComplain: (t: Transaction) => void }) {
  const complaints   = useStore(s => s.complaints);
  const user         = useStore(s => s.currentUser);

  const isCredit    = txn.type === 'credit';
  const isPending   = txn.status === 'pending';
  const isReleased  = txn.status === 'released';
  const isRefunded  = txn.status === 'refunded';

  const isPayUpfrontCredit = isCredit && txn.transferType === 'payupfront' && isPending;
  const deadlineToday = isPayUpfrontCredit && txn.projectId
    ? false  // We'd need the project deadline here; handled via project lookup in parent
    : false;

  const hasComplaint = complaints.some(c => c.transactionId === txn.id && c.userId === user?.id);

  const iconBg = isCredit
    ? (isPending ? 'rgba(245,166,35,0.15)' : '#D6F5EA')
    : (isPending ? 'rgba(245,166,35,0.15)' : isRefunded ? 'rgba(122,139,168,0.15)' : 'rgba(255,107,53,0.1)');

  const icon = isCredit
    ? (isPending ? '🛡' : '↙')
    : (isPending ? '🛡' : isRefunded ? '↩' : '↗');

  const amtColor = isCredit
    ? (isPending ? '#92600A' : '#009962')
    : (isRefunded ? '#7A8BA8' : '#FF4757');

  const badge = isPending ? 'Pending'
              : isReleased ? 'Credit Alert'
              : isRefunded ? 'Refunded'
              : isCredit ? 'Received' : 'Sent';

  const badgeStyle = isPending
    ? { background: 'rgba(245,166,35,0.15)', color: '#92600A' }
    : isReleased
    ? { background: '#D6F5EA', color: '#009962' }
    : isRefunded
    ? { background: 'rgba(122,139,168,0.15)', color: '#7A8BA8' }
    : isCredit
    ? { background: '#D6F5EA', color: '#009962' }
    : { background: 'rgba(255,107,53,0.1)', color: '#CC3311' };

  return (
    <div className="px-4 py-4 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
             style={{ background: iconBg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-primary truncate">{txn.description}</p>
          {txn.purpose && txn.purpose !== txn.description && (
            <p className="text-xs text-ink-muted truncate">Purpose: {txn.purpose}</p>
          )}
          {txn.fromUserName && (
            <p className="text-xs text-ink-muted">From: {txn.fromUserName}</p>
          )}
          {!isCredit && txn.recipientName && txn.recipientName !== 'External Account' && (
            <p className="text-xs text-ink-muted">To: {txn.recipientName}</p>
          )}
          <p className="text-xs text-ink-muted">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: amtColor }}>
            {isCredit ? '+' : '-'}{formatNaira(txn.amount)}
          </p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={badgeStyle}>
            {badge}
          </span>
        </div>
      </div>

      {/* Complaint button for pending Pay Upfront credit (beneficiary view) */}
      {isPayUpfrontCredit && !hasComplaint && (
        <div className="mt-2 ml-16">
          <p className="text-[11px] text-ink-muted mb-1">{txn.fromUserName
            ? `Paid by ${txn.fromUserName}. Awaiting release.`
            : 'Awaiting payment release.'}</p>
          <button
            onClick={() => onComplain(txn)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.25)' }}
          >
            Work done? Log a complaint →
          </button>
        </div>
      )}

      {isPayUpfrontCredit && hasComplaint && (
        <div className="mt-2 ml-16 flex items-center gap-1.5">
          <span className="text-[10px]">✅</span>
          <p className="text-[11px] font-semibold" style={{ color: '#009962' }}>Complaint submitted</p>
        </div>
      )}
    </div>
  );
}

// ── History page ──────────────────────────────────────────────
export function History() {
  const transactions = useStore(s => s.transactions);
  const projects     = useStore(s => s.projects);
  const submitComplaint = useStore(s => s.submitComplaint);
  const user         = useStore(s => s.currentUser);
  const L            = useLang();

  const [complainTxn, setComplainTxn] = useState<Transaction | null>(null);
  const [successMsg, setSuccessMsg]   = useState('');

  const reversed = transactions.slice().reverse();

  const totals = transactions.reduce((acc, t) => ({
    in:  acc.in  + (t.type === 'credit' && t.status !== 'refunded' ? t.amount : 0),
    out: acc.out + (t.type === 'debit'  && t.status !== 'refunded' ? t.amount : 0),
  }), { in: 0, out: 0 });

  // Check if any pending credits have a deadline today
  const deadlineTodayTxns = reversed.filter(t => {
    if (t.type !== 'credit' || t.status !== 'pending' || !t.projectId) return false;
    const proj = projects.find(p => p.id === t.projectId);
    return proj ? isToday(proj.deadline) : false;
  });

  const handleComplaintSubmit = (desc: string, file?: { name: string; type: string; data: string }) => {
    if (!complainTxn || !user) return;
    const complaints = getComplaints();
    const already = complaints.some(c => c.transactionId === complainTxn.id && c.userId === user.id);
    if (already) { setSuccessMsg(L.complaint_already); setComplainTxn(null); return; }

    submitComplaint({
      transactionId: complainTxn.id,
      projectId: complainTxn.projectId,
      userId: user.id,
      description: desc,
      proofFileName: file?.name,
      proofFileType: file?.type,
      proofFileData: file?.data,
    });
    setComplainTxn(null);
    setSuccessMsg(L.complaint_submitted);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-white font-bold text-xl mb-4">Transaction History</h1>
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
        {/* Deadline today banner */}
        {deadlineTodayTxns.length > 0 && (
          <div className="mx-4 mt-4 p-4 rounded-2xl animate-fade-in"
               style={{ background: 'rgba(245,166,35,0.1)', border: '2px solid rgba(245,166,35,0.4)', animation: 'pulseMic 2s ease-in-out infinite' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#92600A' }}>Deadline Reminder</p>
                <p className="text-xs text-ink-muted mt-0.5">{L.payupfront_deadline_reminder}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success toast */}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl animate-fade-in"
               style={{ background: '#D6F5EA', border: '1px solid rgba(0,194,124,0.3)' }}>
            <p className="text-sm font-semibold text-brand-accent">{successMsg}</p>
          </div>
        )}

        <div className="mx-4 mt-4 bg-white rounded-2xl card overflow-hidden">
          {reversed.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-5xl mb-4 block">📋</span>
              <p className="text-sm text-ink-muted">No transactions yet.</p>
            </div>
          ) : (
            reversed.map(t => (
              <TxnCard key={t.id} txn={t} onComplain={setComplainTxn} />
            ))
          )}
        </div>
        <div className="h-6" />
      </div>

      {/* Complaint modal */}
      {complainTxn && (
        <ComplaintModal
          txn={complainTxn}
          onClose={() => setComplainTxn(null)}
          onSubmit={handleComplaintSubmit}
        />
      )}

      <BottomNav />
    </div>
  );
}
