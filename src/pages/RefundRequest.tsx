import { useState, useMemo } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { MicButton } from '../components/amira/MicButton';
import { formatNaira, formatDate, getProjects } from '../utils';
import type { Project } from '../types';

function statusLabel(s: Project['status']): string {
  return {
    active:                'Active',
    completed:             'Completed',
    refund_requested:      'Refund Requested',
    refund_review_pending: 'Under Review',
    escalated:             'Escalated',
    refunded:              'Refunded',
  }[s] ?? s;
}

export function RefundRequest() {
  const navigate           = useStore(s => s.navigate);
  const currentUser        = useStore(s => s.currentUser);
  const selectedProjectId  = useStore(s => s.selectedProjectId);
  const requestRefund      = useStore(s => s.requestRefund);
  const L                  = useLang();
  const { speak, converse, stopSpeaking } = useAmira();

  const [reason, setReason]       = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [micBusy, setMicBusy]     = useState(false);
  const [error, setError]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load project from storage (not store, since store only has sender's projects)
  const project = useMemo<Project | null>(() => {
    if (!selectedProjectId) return null;
    const all = getProjects();
    return all.find(p => p.id === selectedProjectId) ?? null;
  }, [selectedProjectId]);

  if (!currentUser || !project) {
    return (
      <div className="phone-frame bg-surface-light flex items-center justify-center">
        <div className="text-center px-8">
          <span className="text-4xl block mb-3">❌</span>
          <p className="text-sm text-ink-muted mb-4">Project not found.</p>
          <button onClick={() => navigate('payupfront')}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-ink-primary"
                  style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleVoiceReason = async () => {
    if (micBusy) { stopSpeaking(); setMicBusy(false); return; }
    setMicBusy(true);
    const prompt = 'Please explain why you are requesting this refund. Speak now.';
    const resp = await converse(prompt, { listenMs: 30000, maxRetries: 2 });
    if (resp) setReason(prev => prev ? `${prev} ${resp}` : resp);
    setMicBusy(false);
  };

  const handleSubmit = () => {
    setError('');
    if (!reason.trim()) {
      setError('Please provide a reason for the refund request.');
      return;
    }
    const ok = requestRefund(project.id, reason.trim());
    if (ok) {
      speak('Your refund request has been submitted. The freelancer will be notified.');
      setSubmitted(true);
    } else {
      setError('Unable to submit request. The project may have already been acted on.');
    }
  };

  // ── Success state ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="phone-frame bg-surface-light">
        <div className="scroll-area flex flex-col items-center justify-center text-center px-8 pt-24">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
               style={{ background: 'rgba(124,77,255,0.1)' }}>
            ⏳
          </div>
          <h2 className="text-xl font-black text-ink-primary mb-3">Request Submitted</h2>
          <p className="text-sm text-ink-muted mb-2 leading-relaxed">
            Your refund request for <strong>"{project.title}"</strong> has been submitted.
          </p>
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            The freelancer has been notified and will need to respond. The protected funds of{' '}
            <strong>{formatNaira(project.upfrontAmount)}</strong> remain locked during the review.
          </p>

          {/* Status progression */}
          <div className="w-full text-left mb-6">
            {[
              { label: 'Refund Requested', done: true },
              { label: 'Freelancer Notified', done: true },
              { label: 'Awaiting Response', active: true },
              { label: 'Resolution', done: false },
            ].map(({ label, done, active }, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                     style={{
                       background: done ? '#D6F5EA' : active ? 'rgba(124,77,255,0.12)' : '#F4F6FB',
                       color: done ? '#009962' : active ? '#7C4DFF' : '#CBD3E8',
                     }}>
                  {done ? '✓' : active ? '●' : '○'}
                </div>
                <span className="text-sm font-semibold"
                      style={{ color: done ? '#009962' : active ? '#7C4DFF' : '#CBD3E8' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('payupfront')}
                  className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
            Back to Pay Upfront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0"
           style={{ background: 'linear-gradient(135deg, #0D1B3E, #7C4DFF)' }}>
        <div className="flex items-center gap-3 px-5 pt-12 pb-5">
          <button onClick={() => navigate('payupfront')}
                  className="text-white/70 text-sm p-1 -ml-1">← Back</button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Request Refund</h1>
            <p className="text-white/50 text-xs">Escrow dispute process</p>
          </div>
        </div>
      </div>

      <div className="scroll-area">
        {/* Amira guidance */}
        <div className="mt-4 px-4">
          <AmiraBubble
            text="We will protect both parties fairly. Please describe what went wrong, and we'll ensure the case is reviewed carefully."
            compact={false}
          />
        </div>

        {/* ── Project Information ── */}
        <div className="mx-4 mt-4">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Project Information</p>
          <div className="bg-white rounded-2xl overflow-hidden card">
            {[
              { label: 'Project Name',    value: project.title },
              { label: 'Freelancer',      value: project.recipientName },
              { label: 'Protected Amount',value: formatNaira(project.upfrontAmount) },
              { label: 'Total Value',     value: formatNaira(project.totalAmount) },
              { label: 'Created',         value: formatDate(project.createdAt) },
              { label: 'Deadline',        value: formatDate(project.deadline) },
              { label: 'Status',          value: statusLabel(project.status) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-3 border-b last:border-0"
                   style={{ borderColor: '#E4E9F2' }}>
                <span className="text-xs text-ink-muted">{label}</span>
                <span className="text-sm font-semibold text-ink-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Refund Reason ── */}
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Reason for Refund *</p>
            {/* Voice / Text toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #E4E9F2' }}>
              <button onClick={() => setVoiceMode(false)}
                      className="px-3 py-1.5 text-[11px] font-bold transition-all"
                      style={{ background: !voiceMode ? '#0D1B3E' : '#fff', color: !voiceMode ? '#fff' : '#7A8BA8' }}>
                ✏️ Type
              </button>
              <button onClick={() => setVoiceMode(true)}
                      className="px-3 py-1.5 text-[11px] font-bold transition-all"
                      style={{ background: voiceMode ? '#0D1B3E' : '#fff', color: voiceMode ? '#fff' : '#7A8BA8' }}>
                🎤 Voice
              </button>
            </div>
          </div>

          {/* Guidance questions */}
          <div className="mb-3 p-3 rounded-xl" style={{ background: '#F4F6FB' }}>
            <p className="text-xs font-semibold text-ink-secondary mb-1.5">Consider including:</p>
            <ul className="text-xs text-ink-muted space-y-1">
              <li>• Why are you requesting this refund?</li>
              <li>• Was the work delivered as agreed?</li>
              <li>• Did communication break down?</li>
              <li>• What was the issue with the delivery?</li>
            </ul>
          </div>

          {!voiceMode ? (
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe the situation in detail…"
              rows={5}
              className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
              style={{ borderColor: reason ? '#7C4DFF' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
            />
          ) : (
            <div className="flex flex-col items-center py-6 rounded-2xl"
                 style={{ border: '2px dashed #CBD3E8', background: '#F4F6FB' }}>
              <p className="text-xs text-ink-muted mb-4">
                Tap the mic and explain your situation. Amira will listen patiently.
              </p>
              <MicButton onClick={handleVoiceReason} size="md" label="Speak" />
              {reason && (
                <div className="mt-4 px-4 py-3 rounded-xl w-full" style={{ background: '#fff', border: '1px solid #E4E9F2' }}>
                  <p className="text-xs text-ink-muted mb-1">Recorded:</p>
                  <p className="text-sm text-ink-primary">{reason}</p>
                  <button onClick={() => setReason('')}
                          className="text-[10px] font-semibold mt-1"
                          style={{ color: '#FF4757' }}>Clear</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Evidence Section ── */}
        <div className="mx-4 mt-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Evidence</p>
          <div className="rounded-2xl p-5 flex flex-col items-center text-center"
               style={{ background: '#F4F6FB', border: '2px dashed #CBD3E8' }}>
            <span className="text-3xl mb-2 opacity-40">📎</span>
            <p className="text-sm font-semibold text-ink-muted mb-1">Evidence Upload</p>
            <p className="text-xs text-ink-muted">
              Evidence upload (photos, videos, messages) will be available in a future update.
            </p>
          </div>
        </div>

        {/* ── What happens next ── */}
        <div className="mx-4 mt-5 mb-2">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">What Happens Next</p>
          <div className="bg-white rounded-2xl card overflow-hidden">
            {[
              { icon: '📨', step: '1', text: 'Your request is submitted and the freelancer is notified.' },
              { icon: '🔒', step: '2', text: 'Protected funds remain locked during the review period.' },
              { icon: '💬', step: '3', text: 'The freelancer can accept the refund or contest with evidence.' },
              { icon: '⚖️', step: '4', text: 'If contested, the case is escalated for review.' },
            ].map(({ icon, step, text }) => (
              <div key={step} className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
                   style={{ borderColor: '#E4E9F2' }}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <p className="text-xs text-ink-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)' }}>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="mx-4 mt-5 mb-4">
          <button onClick={handleSubmit}
                  className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #7C4DFF, #3D5AFE)', color: '#fff', boxShadow: '0 4px 20px rgba(124,77,255,0.35)' }}>
            Submit Refund Request
          </button>
          <p className="text-center text-xs text-ink-muted mt-3">
            Funds remain locked until resolution. Both parties are protected.
          </p>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
