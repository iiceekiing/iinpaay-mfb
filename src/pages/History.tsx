import { useRef, useState } from 'react';
import { useStore, useLang } from '../store';
import { BottomNav } from '../components/ui/BottomNav';
import { formatNaira, formatDate, formatTime, isToday, getComplaints, getRefundRequests, getProjects } from '../utils';
import type { Transaction, AppNotification, RefundRequest } from '../types';

// ── Complaint modal ────────────────────────────────────────────
function ComplaintModal({ txn, onClose, onSubmit }: {
  txn: Transaction;
  onClose: () => void;
  onSubmit: (desc: string, file?: { name: string; type: string; data: string }) => void;
}) {
  const L       = useLang();
  const [desc, setDesc]       = useState('');
  const [file, setFile]       = useState<{ name: string; type: string; data: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy]       = useState(false);
  const fileRef               = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError('');
    if (f.size > 10 * 1024 * 1024) { setFileError('File must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, type: f.type, data: reader.result as string });
    reader.readAsDataURL(f);
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
        <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
          <p className="text-xs text-ink-secondary font-semibold truncate">{txn.description}</p>
          <p className="text-xs text-ink-muted">{formatNaira(txn.amount)}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.complaint_desc_label} *</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder={L.complaint_desc_prompt} rows={4}
                    className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
                    style={{ borderColor: desc ? '#00C27C' : '#CBD3E8', background: '#f8f9fc', color: '#0D1B3E' }} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.complaint_upload_label}</label>
          <div onClick={() => fileRef.current?.click()}
               className="w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer"
               style={{ borderColor: file ? '#00C27C' : '#CBD3E8', background: file ? '#f0fdf8' : '#f8f9fc' }}>
            {file ? (
              <>
                <span className="text-2xl">{file.type.startsWith('video') ? '🎬' : '🖼️'}</span>
                <p className="text-xs font-semibold text-ink-primary truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-brand-accent">✓ Attached</p>
              </>
            ) : (
              <>
                <span className="text-2xl">📎</span>
                <p className="text-sm font-semibold text-ink-muted">Tap to upload proof</p>
                <p className="text-[10px] text-ink-muted">Image or video, max 10MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        </div>
        <button onClick={() => { setBusy(true); onSubmit(desc, file ?? undefined); }}
                disabled={busy}
                className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                style={{ background: busy ? '#CBD3E8' : 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: busy ? 'none' : '0 4px 18px rgba(0,194,124,0.3)' }}>
          {busy ? 'Submitting…' : L.complaint_submit}
        </button>
      </div>
    </div>
  );
}

// ── Contest modal ──────────────────────────────────────────────
function ContestModal({ req, onClose, onSubmit }: {
  req: RefundRequest;
  onClose: () => void;
  onSubmit: (msg: string) => void;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end"
         style={{ background: 'rgba(0,0,0,0.55)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink-primary text-base">Contest Refund</h2>
          <button onClick={onClose} className="text-ink-muted text-lg font-bold">✕</button>
        </div>
        <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.2)' }}>
          <p className="text-xs font-semibold text-ink-secondary">Project: {req.requesterName}</p>
          <p className="text-xs text-ink-muted">Refund reason: {req.reason}</p>
        </div>
        <label className="block text-sm font-semibold text-ink-secondary mb-1.5">Your Response *</label>
        <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  placeholder="Explain why the work was completed and payment should be released…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none mb-4"
                  style={{ borderColor: msg ? '#7C4DFF' : '#CBD3E8', background: '#f8f9fc', color: '#0D1B3E' }} />
        <button onClick={() => { if (msg.trim()) onSubmit(msg); }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C4DFF, #3D5AFE)', boxShadow: '0 4px 16px rgba(124,77,255,0.3)' }}>
          Submit Contest
        </button>
      </div>
    </div>
  );
}

// ── Notification card ─────────────────────────────────────────
function NotificationCard({ note, onRead, onContestRefund, onAcceptRefund }: {
  note: AppNotification;
  onRead: (id: string) => void;
  onContestRefund?: (reqId: string) => void;
  onAcceptRefund?:  (reqId: string) => void;
}) {
  const typeIcon = {
    refund_request:    '⚖️',
    payment_released:  '✅',
    refund_accepted:   '↩',
    refund_contested:  '⚔️',
    deadline:          '⏰',
    info:              '💬',
  }[note.type] ?? '💬';

  const typeColor = {
    refund_request:    '#7C4DFF',
    payment_released:  '#009962',
    refund_accepted:   '#F5A623',
    refund_contested:  '#FF4757',
    deadline:          '#F5A623',
    info:              '#1A3C8F',
  }[note.type] ?? '#1A3C8F';

  return (
    <div className="bg-white rounded-2xl card mb-3 overflow-hidden"
         style={!note.read ? { border: `2px solid ${typeColor}30` } : {}}>
      <div className="h-1" style={{ background: note.read ? '#E4E9F2' : typeColor }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
               style={{ background: `${typeColor}12` }}>
            {typeIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-ink-primary">{note.title}</p>
              {!note.read && (
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeColor }} />
              )}
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">{note.message}</p>
            <p className="text-[10px] text-ink-muted mt-1">{formatDate(note.createdAt)} · {formatTime(note.createdAt)}</p>

            {/* Refund request actions for freelancer */}
            {note.type === 'refund_request' && note.relatedRefundId && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => onAcceptRefund?.(note.relatedRefundId!)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#92600A' }}>
                  ↩ Accept Refund
                </button>
                <button onClick={() => onContestRefund?.(note.relatedRefundId!)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.25)', color: '#7C4DFF' }}>
                  ⚔️ Contest
                </button>
              </div>
            )}

            {!note.read && (
              <button onClick={() => onRead(note.id)}
                      className="text-[10px] font-semibold mt-2"
                      style={{ color: '#7A8BA8' }}>
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transaction card ──────────────────────────────────────────
function TxnCard({ txn, onComplain }: { txn: Transaction; onComplain: (t: Transaction) => void }) {
  const complaints = useStore(s => s.complaints);
  const user       = useStore(s => s.currentUser);
  const projects   = getProjects();

  const isCredit  = txn.type === 'credit';
  const isPending  = txn.status === 'pending';
  const isReleased = txn.status === 'released';
  const isRefunded = txn.status === 'refunded';
  const isPayUpfrontCredit = isCredit && txn.transferType === 'payupfront' && isPending;
  const hasComplaint = complaints.some(c => c.transactionId === txn.id && c.userId === user?.id);

  // Find project for deadline check
  const linkedProject = txn.projectId ? projects.find(p => p.id === txn.projectId) : null;
  const deadlineToday = isPayUpfrontCredit && linkedProject ? isToday(linkedProject.deadline) : false;

  const iconBg = isCredit
    ? (isPending ? 'rgba(245,166,35,0.15)' : '#D6F5EA')
    : (isPending ? 'rgba(245,166,35,0.15)' : isRefunded ? 'rgba(122,139,168,0.15)' : 'rgba(255,107,53,0.1)');

  const icon   = isCredit ? (isPending ? '🛡' : '↙') : (isPending ? '🛡' : isRefunded ? '↩' : '↗');
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
    <div className={`px-4 py-4 border-b last:border-0 ${deadlineToday ? 'relative' : ''}`}
         style={{ borderColor: '#E4E9F2', background: deadlineToday ? 'rgba(245,166,35,0.04)' : undefined }}>

      {/* Deadline today glow strip */}
      {deadlineToday && (
        <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-xl"
             style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)' }}>
          <span className="text-xs">⏰</span>
          <span className="text-[11px] font-bold" style={{ color: '#92600A' }}>
            Deadline today — contact the project owner to release your payment.
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
             style={{ background: iconBg }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-primary truncate">{txn.description}</p>
          {txn.purpose && txn.purpose !== txn.description && (
            <p className="text-xs text-ink-muted truncate">Purpose: {txn.purpose}</p>
          )}
          {txn.fromUserName && <p className="text-xs text-ink-muted">From: {txn.fromUserName}</p>}
          {!isCredit && txn.recipientName && txn.recipientName !== 'External Account' && (
            <p className="text-xs text-ink-muted">To: {txn.recipientName}</p>
          )}
          <p className="text-xs text-ink-muted">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: amtColor }}>
            {isCredit ? '+' : '-'}{formatNaira(txn.amount)}
          </p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={badgeStyle}>{badge}</span>
        </div>
      </div>

      {/* Complaint button for pending Pay Upfront credits */}
      {isPayUpfrontCredit && !hasComplaint && (
        <div className="mt-2 ml-16">
          <p className="text-[11px] text-ink-muted mb-1">
            {txn.fromUserName ? `Paid by ${txn.fromUserName}. Awaiting release.` : 'Awaiting payment release.'}
          </p>
          <button onClick={() => onComplain(txn)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.25)' }}>
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
  const transactions      = useStore(s => s.transactions);
  const notifications     = useStore(s => s.notifications);
  const submitComplaint   = useStore(s => s.submitComplaint);
  const respondToRefund   = useStore(s => s.respondToRefund);
  const markNotificationRead = useStore(s => s.markNotificationRead);
  const markAllRead       = useStore(s => s.markAllNotificationsRead);
  const user              = useStore(s => s.currentUser);
  const L                 = useLang();

  const [complainTxn, setComplainTxn]   = useState<Transaction | null>(null);
  const [contestReq, setContestReq]     = useState<RefundRequest | null>(null);
  const [successMsg, setSuccessMsg]     = useState('');
  const [activeTab, setActiveTab]       = useState<'transactions' | 'notifications'>('transactions');

  const reversed    = transactions.slice().reverse();
  const unreadCount = notifications.filter(n => !n.read).length;

  const totals = transactions.reduce((acc, t) => ({
    in:  acc.in  + (t.type === 'credit' && !['refunded'].includes(t.status) ? t.amount : 0),
    out: acc.out + (t.type === 'debit'  && !['refunded'].includes(t.status) ? t.amount : 0),
  }), { in: 0, out: 0 });

  const handleComplaintSubmit = (desc: string, file?: { name: string; type: string; data: string }) => {
    if (!complainTxn || !user) return;
    const already = getComplaints().some(c => c.transactionId === complainTxn.id && c.userId === user.id);
    if (already) { setSuccessMsg(L.complaint_already); setComplainTxn(null); return; }
    submitComplaint({
      transactionId: complainTxn.id, projectId: complainTxn.projectId,
      userId: user.id, description: desc,
      proofFileName: file?.name, proofFileType: file?.type, proofFileData: file?.data,
    });
    setComplainTxn(null);
    setSuccessMsg(L.complaint_submitted);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleAcceptRefund = (reqId: string) => {
    const ok = respondToRefund(reqId, 'accept', 'I agree to the refund.');
    if (ok) {
      setSuccessMsg('Refund accepted. Funds will be returned to the project owner.');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleContestStart = (reqId: string) => {
    const allReqs = getRefundRequests();
    const req = allReqs.find(r => r.id === reqId);
    if (req) setContestReq(req);
  };

  const handleContestSubmit = (msg: string) => {
    if (!contestReq) return;
    const ok = respondToRefund(contestReq.id, 'contest', msg);
    setContestReq(null);
    if (ok) {
      setSuccessMsg('Your contest has been submitted. The case is now under review.');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-white font-bold text-xl mb-4">Transaction History</h1>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 rounded-2xl p-4" style={{ background: 'rgba(0,194,124,0.12)', border: '1px solid rgba(0,194,124,0.25)' }}>
              <p className="text-white/60 text-xs mb-1">Total In</p>
              <p className="text-white font-bold">{formatNaira(totals.in)}</p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)' }}>
              <p className="text-white/60 text-xs mb-1">Total Out</p>
              <p className="text-white font-bold">{formatNaira(totals.out)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <button onClick={() => setActiveTab('transactions')}
                    className="flex-1 py-2.5 text-sm font-bold transition-all"
                    style={{ background: activeTab === 'transactions' ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff' }}>
              Transactions
            </button>
            <button onClick={() => setActiveTab('notifications')}
                    className="flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ background: activeTab === 'notifications' ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff' }}>
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                      style={{ background: '#FF4757', color: '#fff' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="scroll-area">
        {/* Success toast */}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl animate-fade-in"
               style={{ background: '#D6F5EA', border: '1px solid rgba(0,194,124,0.3)' }}>
            <p className="text-sm font-semibold text-brand-accent">{successMsg}</p>
          </div>
        )}

        {/* ── Transactions tab ── */}
        {activeTab === 'transactions' && (
          <div className="mx-4 mt-4 bg-white rounded-2xl card overflow-hidden">
            {reversed.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-5xl mb-4 block">📋</span>
                <p className="text-sm text-ink-muted">No transactions yet.</p>
              </div>
            ) : (
              reversed.map(t => <TxnCard key={t.id} txn={t} onComplain={setComplainTxn} />)
            )}
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'notifications' && (
          <div className="mx-4 mt-4">
            {unreadCount > 0 && (
              <div className="flex justify-end mb-2">
                <button onClick={markAllRead}
                        className="text-xs font-semibold"
                        style={{ color: '#1A3C8F' }}>
                  Mark all read
                </button>
              </div>
            )}
            {notifications.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl card">
                <span className="text-4xl mb-3 block">🔔</span>
                <p className="text-sm text-ink-muted">No notifications yet.</p>
              </div>
            ) : (
              notifications
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(n => (
                  <NotificationCard
                    key={n.id} note={n}
                    onRead={markNotificationRead}
                    onAcceptRefund={handleAcceptRefund}
                    onContestRefund={handleContestStart}
                  />
                ))
            )}
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* Modals */}
      {complainTxn && (
        <ComplaintModal txn={complainTxn} onClose={() => setComplainTxn(null)} onSubmit={handleComplaintSubmit} />
      )}
      {contestReq && (
        <ContestModal req={contestReq} onClose={() => setContestReq(null)} onSubmit={handleContestSubmit} />
      )}

      <BottomNav />
    </div>
  );
}
