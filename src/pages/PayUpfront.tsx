import { useState, useMemo } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { BottomNav } from '../components/ui/BottomNav';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { formatNaira, formatDate, isToday, isPastDeadline, getUsers } from '../utils';
import type { Project } from '../types';

// ── Project card ──────────────────────────────────────────────
function ProjectCard({
  project,
  onRelease,
  onRefund,
}: {
  project: Project;
  onRelease: (id: string) => void;
  onRefund:  (id: string) => void;
}) {
  const deadlineToday = isToday(project.deadline);
  const deadlinePast  = isPastDeadline(project.deadline);

  const statusColor =
    project.status === 'active'    ? '#F5A623' :
    project.status === 'completed' ? '#009962' : '#7A8BA8';
  const statusLabel =
    project.status === 'active'    ? 'Active' :
    project.status === 'completed' ? 'Paid' : 'Refunded';

  return (
    <div
      className="bg-white rounded-2xl p-4 card mb-3 relative overflow-hidden"
      style={deadlineToday && project.status === 'active'
        ? { border: '2px solid #F5A623', boxShadow: '0 0 18px rgba(245,166,35,0.25)' }
        : {}}
    >
      {/* Glowing deadline badge */}
      {deadlineToday && project.status === 'active' && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
             style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.4)', animation: 'pulseMic 2s ease-in-out infinite' }}>
          <span className="text-base">⏰</span>
          <span className="text-xs font-bold" style={{ color: '#92600A' }}>Deadline is TODAY</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: project.status === 'active' ? 'rgba(245,166,35,0.1)' : '#E4E9F2' }}>
            <span>{project.status === 'active' ? '💰' : project.status === 'completed' ? '✅' : '↩'}</span>
          </div>
          <div>
            <p className="font-bold text-ink-primary text-sm">{project.title}</p>
            <p className="text-xs text-ink-muted">To: {project.recipientName}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: `${statusColor}18`, color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-ink-muted mb-2 line-clamp-2">{project.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 py-2" style={{ borderTop: '1px solid #E4E9F2', borderBottom: '1px solid #E4E9F2' }}>
        <div>
          <p className="text-[10px] text-ink-muted">Total</p>
          <p className="text-sm font-bold text-ink-primary">{formatNaira(project.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-ink-muted">Upfront Paid</p>
          <p className="text-sm font-bold text-brand-accent">{formatNaira(project.upfrontAmount)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-ink-muted">
          Deadline: <span className={deadlineToday ? 'font-bold' : ''} style={deadlineToday ? { color: '#92600A' } : {}}>
            {formatDate(project.deadline)}
          </span>
          {deadlinePast && project.status === 'active' && <span className="ml-1 text-red-500">(overdue)</span>}
        </p>
      </div>

      {/* Release / Refund actions */}
      {project.status === 'active' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onRelease(project.id)}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-ink-primary transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 3px 12px rgba(0,194,124,0.3)' }}
          >
            ✓ Release Payment
          </button>
          <button
            onClick={() => onRefund(project.id)}
            className="px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', color: '#FF4757' }}
          >
            Refund
          </button>
        </div>
      )}
    </div>
  );
}

// ── Create form ────────────────────────────────────────────────
type FormView = 'list' | 'create' | 'pin' | 'done';

export function PayUpfront() {
  const user           = useStore(s => s.currentUser);
  const projects       = useStore(s => s.projects);
  const createPayUpfront = useStore(s => s.createPayUpfront);
  const releasePayment = useStore(s => s.releasePayment);
  const refundPayment  = useStore(s => s.refundPayment);
  const L              = useLang();
  const { speak }      = useAmira();

  const [view, setView] = useState<FormView>('list');

  // Form state
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

  const allUsers = useMemo(
    () => getUsers().filter(u => u.id !== user?.id),
    [user]
  );

  const suggestions = useMemo(() => {
    if (!recipientInput || recipientInput.length < 1) return [];
    const q = recipientInput.toLowerCase();
    return allUsers.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.accountNumber.includes(recipientInput) ||
      u.phone.replace(/\D/g,'').includes(recipientInput.replace(/\D/g,''))
    ).slice(0, 4);
  }, [recipientInput, allUsers]);

  const selectSuggestion = (phone: string, name: string) => {
    setRecipientPhone(phone);
    setRecipientName(name);
    setRecipientInput(name);
  };

  const startCreate = () => {
    setView('create');
    setTitle(''); setDesc(''); setTotalAmount(''); setUpfront('');
    setDeadline(''); setRecipientInput(''); setRecipientPhone(''); setRecipientName('');
    setPin(''); setError('');
    speak(L.payupfront_proj_title_prompt);
  };

  const proceedToPin = () => {
    setError('');
    if (!title.trim())       { setError('Please enter a project title'); return; }
    if (!recipientPhone)     { setError('Please select a recipient'); return; }
    const total  = parseFloat(totalAmount.replace(/,/g,''));
    const up     = parseFloat(upfront.replace(/,/g,''));
    if (!total || total <= 0) { setError('Enter a valid total amount'); return; }
    if (!up || up <= 0)      { setError('Enter a valid upfront amount'); return; }
    if (up > total)          { setError('Upfront cannot exceed total amount'); return; }
    if (!deadline)           { setError('Please select a deadline'); return; }
    if (user && up > user.balance) {
      setError('Insufficient balance for this upfront payment');
      return;
    }
    setConfirmMsg(`You are about to pay ${formatNaira(up)} upfront to ${recipientName} for "${title}". Enter your PIN to confirm.`);
    speak(L.send_pin_prompt);
    setView('pin');
  };

  const confirmCreate = () => {
    setError('');
    if (pin.length < 6)       { setError('Enter your 6-digit PIN'); return; }
    if (pin !== user?.pin)    { setError(L.login_wrong_pin); setPin(''); return; }

    const total = parseFloat(totalAmount.replace(/,/g,''));
    const up    = parseFloat(upfront.replace(/,/g,''));

    const result = createPayUpfront({
      title,
      description: desc || undefined,
      totalAmount: total,
      upfrontAmount: up,
      recipientPhone,
      recipientName,
      deadline,
    });

    if (result.success) {
      speak(L.payupfront_success);
      setView('done');
      setTimeout(() => setView('list'), 2500);
    } else {
      setError(result.error ?? 'Something went wrong');
    }
  };

  const handleRelease = (projectId: string) => {
    if (!confirm('Release payment to beneficiary? This cannot be undone.')) return;
    const ok = releasePayment(projectId);
    if (ok) speak(L.payupfront_released);
  };

  const handleRefund = (projectId: string) => {
    if (!confirm('Refund the upfront amount back to your account?')) return;
    const ok = refundPayment(projectId);
    if (ok) speak('Refund processed successfully.');
  };

  if (!user) return null;

  const activeProjects    = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status !== 'active');

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          {view !== 'list' && (
            <button onClick={() => setView(view === 'pin' ? 'create' : 'list')}
                    className="text-white/70 text-sm p-1 -ml-1">← {L.back}</button>
          )}
          <h1 className="text-white font-bold text-xl flex-1">
            {view === 'list'   ? L.payupfront_title :
             view === 'create' ? L.payupfront_new   :
             view === 'pin'    ? 'Confirm Payment'  : 'Done!'}
          </h1>
          {view === 'list' && (
            <button
              onClick={startCreate}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(0,194,124,0.18)', color: '#00C27C', border: '1px solid rgba(0,194,124,0.4)' }}
            >
              + New
            </button>
          )}
        </div>
      </div>

      <div className="scroll-area">

        {/* ── List view ── */}
        {view === 'list' && (
          <div className="px-4 pt-4">
            <AmiraBubble />

            {projects.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">💰</span>
                <p className="text-sm text-ink-muted mb-2">No pay-upfront projects yet.</p>
                <p className="text-xs text-ink-muted mb-5 px-6">
                  Use Pay Upfront to safely pay a freelancer or contractor. Funds are held until you confirm delivery.
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
                      <ProjectCard key={p.id} project={p} onRelease={handleRelease} onRefund={handleRefund} />
                    ))}
                  </>
                )}
                {completedProjects.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 mt-4">Completed</p>
                    {completedProjects.map(p => (
                      <ProjectCard key={p.id} project={p} onRelease={handleRelease} onRefund={handleRefund} />
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

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                  {L.payupfront_proj_title} *
                </label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                       placeholder="e.g. Logo Design, Website Build…"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: title ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>

              {/* Description (optional) */}
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                  {L.payupfront_proj_desc}
                </label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                          placeholder="Describe the scope of work… (optional)" rows={2}
                          className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
                          style={{ borderColor: '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                  {L.payupfront_recipient} *
                </label>
                <input value={recipientInput}
                       onChange={e => { setRecipientInput(e.target.value); setRecipientPhone(''); setRecipientName(''); }}
                       placeholder="Name, phone, or account number"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: recipientPhone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                {/* Suggestions */}
                {suggestions.length > 0 && !recipientPhone && (
                  <div className="bg-white rounded-2xl mt-1 card overflow-hidden" style={{ border: '1px solid #E4E9F2' }}>
                    {suggestions.map(u => (
                      <button key={u.id} onClick={() => selectSuggestion(u.phone, u.fullName)}
                              className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 active:bg-surface-light text-left"
                              style={{ borderColor: '#E4E9F2' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                             style={{ background: '#D6F5EA', color: '#009962' }}>
                          {u.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">{u.fullName}</p>
                          <p className="text-xs text-ink-muted">{u.accountNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {recipientPhone && (
                  <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl"
                       style={{ background: '#D6F5EA' }}>
                    <span className="text-brand-accent">✓</span>
                    <span className="text-sm font-semibold text-ink-primary">{recipientName}</span>
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                    {L.payupfront_total_amount} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input value={totalAmount} onChange={e => setTotalAmount(e.target.value.replace(/[^0-9.]/g,''))}
                           type="number" placeholder="0"
                           className="w-full pl-8 pr-3 py-4 rounded-2xl text-sm font-bold border-2 transition-all"
                           style={{ borderColor: totalAmount ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                    {L.payupfront_upfront_amount} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input value={upfront} onChange={e => setUpfront(e.target.value.replace(/[^0-9.]/g,''))}
                           type="number" placeholder="0"
                           className="w-full pl-8 pr-3 py-4 rounded-2xl text-sm font-bold border-2 transition-all"
                           style={{ borderColor: upfront ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                  </div>
                </div>
              </div>

              {/* Balance hint */}
              <p className="text-xs text-ink-muted -mt-2">Your balance: {formatNaira(user.balance)}</p>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-1.5">
                  {L.payupfront_deadline} *
                </label>
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
              <p className="text-xs text-ink-muted mb-2">{confirmMsg}</p>
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

        {/* ── Done ── */}
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
    </div>
  );
}
