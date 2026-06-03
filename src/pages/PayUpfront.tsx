import { useState, useMemo } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { BottomNav } from '../components/ui/BottomNav';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { formatNaira, formatDate, formatDateTime, isToday, isPastDeadline, getUsers } from '../utils';
import type { Project, TimelineEvent } from '../types';

// ── Status helpers ────────────────────────────────────────────
function statusLabel(s: Project['status']): string {
  return {
    active:                'Active',
    completed:             'Paid',
    refund_requested:      'Refund Requested',
    refund_review_pending: 'Under Review',
    escalated:             'Escalated',
    refunded:              'Refunded',
  }[s] ?? s;
}
function statusColor(s: Project['status']): string {
  return {
    active:                '#F5A623',
    completed:             '#009962',
    refund_requested:      '#FF6B35',
    refund_review_pending: '#7C4DFF',
    escalated:             '#FF4757',
    refunded:              '#7A8BA8',
  }[s] ?? '#7A8BA8';
}

// ── Timeline component ────────────────────────────────────────
function ProjectTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Project Timeline</p>
      <div className="relative pl-5">
        {events.map((ev, i) => (
          <div key={ev.id} className="relative mb-3 last:mb-0">
            {/* Vertical line */}
            {i < events.length - 1 && (
              <div className="absolute left-[-13px] top-[18px] w-[1px] h-full"
                   style={{ background: '#E4E9F2' }} />
            )}
            {/* Dot */}
            <div className="absolute left-[-17px] top-[6px] w-2 h-2 rounded-full"
                 style={{ background: i === events.length - 1 ? '#00C27C' : '#CBD3E8' }} />
            <div className="bg-white rounded-xl px-3 py-2" style={{ border: '1px solid #E4E9F2' }}>
              <p className="text-xs font-semibold text-ink-primary">{ev.event}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {formatDateTime(ev.timestamp)}{ev.actor ? ` · ${ev.actor}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Release Money Modal ───────────────────────────────────────
function ReleaseModal({
  project,
  onCancel,
  onConfirm,
}: {
  project: Project;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const allUsers = useMemo(() => getUsers(), []);
  const freelancer = allUsers.find(u => u.phone.replace(/\s/g,'') === project.recipientPhone.replace(/\s/g,''));

  return (
    <div className="fixed inset-0 z-50 flex items-end"
         style={{ background: 'rgba(0,0,0,0.6)' }}
         onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-3xl overflow-hidden animate-slide-up">

        {/* Header stripe */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #00C27C, #00E89A)' }} />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                 style={{ background: '#D6F5EA' }}>✓</div>
            <div>
              <p className="font-black text-ink-primary text-base">Release Payment</p>
              <p className="text-xs text-ink-muted">Transfer funds to freelancer</p>
            </div>
          </div>

          {/* Project details */}
          <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #E4E9F2' }}>
            {[
              { label: 'Project', value: project.title },
              { label: 'Freelancer', value: project.recipientName },
              { label: 'Amount', value: formatNaira(project.upfrontAmount) },
              { label: 'Account', value: freelancer?.accountNumber ?? project.recipientPhone },
            ].map(({ label, value }, i) => (
              <div key={label}
                   className={`flex justify-between px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                   style={{ borderColor: '#E4E9F2' }}>
                <span className="text-xs text-ink-muted">{label}</span>
                <span className="text-sm font-bold text-ink-primary">{value}</span>
              </div>
            ))}
          </div>

          {/* Confirmation text */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(0,194,124,0.06)', border: '1px solid rgba(0,194,124,0.2)' }}>
            <p className="text-sm font-semibold text-ink-primary mb-1">Are you sure you want to release this payment?</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              This action will transfer the protected funds to the freelancer and cannot be automatically reversed.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
                    style={{ background: '#F4F6FB', color: '#7A8BA8' }}>
              Cancel
            </button>
            <button onClick={onConfirm}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 16px rgba(0,194,124,0.35)' }}>
              Confirm Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────
function ProjectCard({
  project,
  onRelease,
  onRequestRefund,
  onDirectRefund,
  expanded,
  onToggleExpand,
}: {
  project: Project;
  onRelease: (p: Project) => void;
  onRequestRefund: (p: Project) => void;
  onDirectRefund: (p: Project) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const deadlineToday = isToday(project.deadline);
  const deadlinePast  = isPastDeadline(project.deadline);
  const sColor        = statusColor(project.status);
  const sLabel        = statusLabel(project.status);
  const isActive      = project.status === 'active';
  const isRefundReq   = project.status === 'refund_requested';

  return (
    <div className="bg-white rounded-2xl card mb-4 overflow-hidden"
         style={deadlineToday && isActive
           ? { border: '2px solid #F5A623', boxShadow: '0 0 20px rgba(245,166,35,0.2)' }
           : {}}>

      {/* Status bar */}
      <div className="h-1" style={{ background: sColor }} />

      <div className="p-4">
        {/* Deadline today banner */}
        {deadlineToday && isActive && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
               style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.35)', animation: 'pulseMic 2s ease-in-out infinite' }}>
            <span>⏰</span>
            <span className="text-xs font-bold" style={{ color: '#92600A' }}>Deadline is TODAY</span>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${sColor}18` }}>
              <span>{isActive ? '💰' : project.status === 'completed' ? '✅' : project.status === 'refund_requested' ? '⏳' : project.status === 'refund_review_pending' ? '🔍' : '↩'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-primary text-sm truncate">{project.title}</p>
              <p className="text-xs text-ink-muted">To: {project.recipientName}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0"
                style={{ background: `${sColor}18`, color: sColor }}>
            {sLabel}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-ink-muted mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-2 py-3 mb-3"
             style={{ borderTop: '1px solid #E4E9F2', borderBottom: '1px solid #E4E9F2' }}>
          <div>
            <p className="text-[10px] text-ink-muted">Total Value</p>
            <p className="text-sm font-bold text-ink-primary">{formatNaira(project.totalAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-muted">Upfront (Escrowed)</p>
            <p className="text-sm font-bold text-brand-accent">{formatNaira(project.upfrontAmount)}</p>
          </div>
        </div>

        {/* Deadline */}
        <p className="text-xs text-ink-muted mb-3">
          Deadline: <span className={deadlineToday ? 'font-bold' : ''} style={deadlineToday ? { color: '#92600A' } : {}}>
            {formatDate(project.deadline)}
          </span>
          {deadlinePast && isActive && <span className="text-red-500 ml-1">(overdue)</span>}
        </p>

        {/* Actions */}
        {(isActive || isRefundReq) && (
          <div className="flex gap-2 mt-1">
            {(isActive || isRefundReq) && (
              <button onClick={() => onRelease(project)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm text-ink-primary transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 3px 10px rgba(0,194,124,0.3)' }}>
                ✓ Release Money
              </button>
            )}
            {isActive && (
              <button onClick={() => onRequestRefund(project)}
                      className="px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                      style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', color: '#92600A' }}>
                Request Refund
              </button>
            )}
          </div>
        )}

        {/* Expand / collapse timeline */}
        <button onClick={onToggleExpand}
                className="w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#F4F6FB', color: '#7A8BA8' }}>
          {expanded ? '▲ Hide Timeline' : '▼ Show Timeline'}
        </button>

        {expanded && <ProjectTimeline events={project.timeline} />}
      </div>
    </div>
  );
}

// ── Create form ────────────────────────────────────────────────
type FormView = 'list' | 'create' | 'pin' | 'done';

export function PayUpfront() {
  const user             = useStore(s => s.currentUser);
  const projects         = useStore(s => s.projects);
  const createPayUpfront = useStore(s => s.createPayUpfront);
  const releasePayment   = useStore(s => s.releasePayment);
  const refundPayment    = useStore(s => s.refundPayment);
  const navigate         = useStore(s => s.navigate);
  const L                = useLang();
  const { speak }        = useAmira();

  const [view, setView]             = useState<FormView>('list');
  const [releaseProject, setReleaseProject] = useState<Project | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [title, setTitle]             = useState('');
  const [desc, setDesc]               = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [upfront, setUpfront]         = useState('');
  const [deadline, setDeadline]       = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName]   = useState('');
  const [pin, setPin]                 = useState('');
  const [error, setError]             = useState('');
  const [confirmMsg, setConfirmMsg]   = useState('');

  const allUsers = useMemo(() => getUsers().filter(u => u.id !== user?.id), [user]);

  const suggestions = useMemo(() => {
    if (!recipientInput) return [];
    const q = recipientInput.toLowerCase();
    return allUsers.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.accountNumber.includes(recipientInput) ||
      u.phone.replace(/\D/g,'').includes(recipientInput.replace(/\D/g,''))
    ).slice(0, 4);
  }, [recipientInput, allUsers]);

  const startCreate = () => {
    setView('create');
    setTitle(''); setDesc(''); setTotalAmount(''); setUpfront('');
    setDeadline(''); setRecipientInput(''); setRecipientPhone(''); setRecipientName('');
    setPin(''); setError('');
    speak(L.payupfront_proj_title_prompt);
  };

  const proceedToPin = () => {
    setError('');
    if (!title.trim())     { setError('Please enter a project title'); return; }
    if (!recipientPhone)   { setError('Please select a recipient'); return; }
    const total = parseFloat(totalAmount.replace(/,/g,''));
    const up    = parseFloat(upfront.replace(/,/g,''));
    if (!total || total <= 0) { setError('Enter a valid total amount'); return; }
    if (!up || up <= 0)       { setError('Enter a valid upfront amount'); return; }
    if (up > total)           { setError('Upfront cannot exceed total'); return; }
    if (!deadline)            { setError('Please select a deadline'); return; }
    if (user && up > user.balance) { setError('Insufficient balance for this payment'); return; }
    setConfirmMsg(`Paying ${formatNaira(up)} upfront to ${recipientName} for "${title}".`);
    speak(L.send_pin_prompt);
    setView('pin');
  };

  const confirmCreate = () => {
    setError('');
    if (pin.length < 6)   { setError('Enter your 6-digit PIN'); return; }
    if (pin !== user?.pin){ setError(L.login_wrong_pin); setPin(''); return; }
    const result = createPayUpfront({
      title, description: desc || undefined,
      totalAmount: parseFloat(totalAmount.replace(/,/g,'')),
      upfrontAmount: parseFloat(upfront.replace(/,/g,'')),
      recipientPhone, recipientName, deadline,
    });
    if (result.success) {
      speak(L.payupfront_success);
      setView('done');
      setTimeout(() => setView('list'), 2500);
    } else {
      setError(result.error ?? 'Something went wrong');
    }
  };

  const handleRelease = (project: Project) => {
    setReleaseProject(project);
  };

  const confirmRelease = () => {
    if (!releaseProject) return;
    const ok = releasePayment(releaseProject.id);
    setReleaseProject(null);
    if (ok) speak(L.payupfront_released);
  };

  const handleRequestRefund = (project: Project) => {
    navigate('refundrequest', project.id);
  };

  const handleDirectRefund = (project: Project) => {
    // Only for truly active (no dispute yet) — cancels with immediate refund
    const ok = refundPayment(project.id);
    if (ok) speak('Refund processed. Funds returned to your account.');
  };

  if (!user) return null;

  const activeProjects    = projects.filter(p => ['active','refund_requested','refund_review_pending','escalated'].includes(p.status));
  const completedProjects = projects.filter(p => ['completed','refunded'].includes(p.status));

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          {view !== 'list' && (
            <button onClick={() => setView(view === 'pin' ? 'create' : 'list')}
                    className="text-white/70 text-sm p-1 -ml-1">← {L.back}</button>
          )}
          <h1 className="text-white font-bold text-xl flex-1">
            {view === 'list' ? L.payupfront_title : view === 'create' ? L.payupfront_new : view === 'pin' ? 'Confirm' : 'Done!'}
          </h1>
          {view === 'list' && (
            <button onClick={startCreate}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(0,194,124,0.18)', color: '#00C27C', border: '1px solid rgba(0,194,124,0.4)' }}>
              + New
            </button>
          )}
        </div>
      </div>

      <div className="scroll-area">

        {/* ── Project list ── */}
        {view === 'list' && (
          <div className="px-4 pt-4">
            <AmiraBubble />
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">💰</span>
                <p className="text-sm text-ink-muted mb-2">No pay-upfront projects yet.</p>
                <p className="text-xs text-ink-muted mb-6 px-6">
                  Use Pay Upfront to securely pay a freelancer or contractor. Funds are held in escrow until you confirm delivery.
                </p>
                <button onClick={startCreate}
                        className="px-6 py-3 rounded-2xl font-bold text-sm text-ink-primary"
                        style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
                  + Create Pay Upfront
                </button>
              </div>
            ) : (
              <>
                {activeProjects.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Active</p>
                    {activeProjects.map(p => (
                      <ProjectCard
                        key={p.id} project={p}
                        onRelease={handleRelease}
                        onRequestRefund={handleRequestRefund}
                        onDirectRefund={handleDirectRefund}
                        expanded={expandedId === p.id}
                        onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      />
                    ))}
                  </>
                )}
                {completedProjects.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 mt-2">Completed</p>
                    {completedProjects.map(p => (
                      <ProjectCard
                        key={p.id} project={p}
                        onRelease={handleRelease}
                        onRequestRefund={handleRequestRefund}
                        onDirectRefund={handleDirectRefund}
                        expanded={expandedId === p.id}
                        onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Create form ── */}
        {view === 'create' && (
          <div className="px-4 pt-4 animate-slide-up">
            <AmiraBubble />
            <div className="mt-4 space-y-4">

              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_proj_title} *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                       placeholder="e.g. Logo Design, Website Build…"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: title ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_proj_desc}</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                          placeholder="Describe scope of work… (optional)" rows={2}
                          className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
                          style={{ borderColor: '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_recipient} *</label>
                <input value={recipientInput}
                       onChange={e => { setRecipientInput(e.target.value); setRecipientPhone(''); setRecipientName(''); }}
                       placeholder="Name, phone, or account number"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: recipientPhone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                {suggestions.length > 0 && !recipientPhone && (
                  <div className="bg-white rounded-2xl mt-1 overflow-hidden" style={{ border: '1px solid #E4E9F2' }}>
                    {suggestions.map(u => (
                      <button key={u.id}
                              onClick={() => { setRecipientPhone(u.phone); setRecipientName(u.fullName); setRecipientInput(u.fullName); }}
                              className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 active:bg-surface-light text-left"
                              style={{ borderColor: '#E4E9F2' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                             style={{ background: '#D6F5EA', color: '#009962' }}>{u.fullName[0]}</div>
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">{u.fullName}</p>
                          <p className="text-xs text-ink-muted">{u.accountNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {recipientPhone && (
                  <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl" style={{ background: '#D6F5EA' }}>
                    <span className="text-brand-accent">✓</span>
                    <span className="text-sm font-semibold text-ink-primary">{recipientName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_total_amount} *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input value={totalAmount} onChange={e => setTotalAmount(e.target.value.replace(/[^0-9.]/g,''))}
                           type="number" placeholder="0"
                           className="w-full pl-8 pr-3 py-4 rounded-2xl text-sm font-bold border-2 transition-all"
                           style={{ borderColor: totalAmount ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_upfront_amount} *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input value={upfront} onChange={e => setUpfront(e.target.value.replace(/[^0-9.]/g,''))}
                           type="number" placeholder="0"
                           className="w-full pl-8 pr-3 py-4 rounded-2xl text-sm font-bold border-2 transition-all"
                           style={{ borderColor: upfront ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-ink-muted -mt-2">Your balance: {formatNaira(user.balance)}</p>

              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">{L.payupfront_deadline} *</label>
                <input value={deadline} onChange={e => setDeadline(e.target.value)}
                       type="date" min={new Date().toISOString().split('T')[0]}
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: deadline ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <button onClick={proceedToPin}
                      className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── PIN confirmation ── */}
        {view === 'pin' && (
          <div className="px-4 pt-4 animate-slide-up">
            <div className="bg-white rounded-2xl p-4 mb-4 card">
              <p className="text-xs text-ink-muted">{confirmMsg}</p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
                 style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
              <span className="text-xl">🔒</span>
              <p className="text-sm" style={{ color: '#92600A' }}>{L.pin_security}</p>
            </div>
            <PinInput value={pin} onChange={setPin} error={!!error && pin.length > 0} />
            {error && <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>}
            <button onClick={confirmCreate}
                    className="mt-5 w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
              ✓ Confirm Pay Upfront
            </button>
          </div>
        )}

        {view === 'done' && (
          <div className="text-center pt-16 animate-slide-up">
            <span className="text-6xl mb-4 block">🎉</span>
            <h2 className="text-xl font-black text-ink-primary mb-2">Payment Sent!</h2>
            <p className="text-sm text-ink-muted px-8">{L.payupfront_success}</p>
          </div>
        )}
        <div className="h-4" />
      </div>

      <BottomNav />

      {/* Release Money Modal */}
      {releaseProject && (
        <ReleaseModal
          project={releaseProject}
          onCancel={() => setReleaseProject(null)}
          onConfirm={confirmRelease}
        />
      )}
    </div>
  );
}
