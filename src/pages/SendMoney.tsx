import { useState, useEffect, useMemo } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { formatNaira, parseAmountFromSpeech, getUsers } from '../utils';
import type { TransferType } from '../types';

type Step = 'recipient' | 'amount' | 'type' | 'pin' | 'confirm' | 'done';

export function SendMoney() {
  const user        = useStore(s => s.currentUser);
  const sendMoney   = useStore(s => s.sendMoney);
  const navigate    = useStore(s => s.navigate);
  const L           = useLang();
  const { speak, prompt, stopSpeaking } = useAmira();

  const [step, setStep]               = useState<Step>('recipient');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName]   = useState('');
  const [amount, setAmount]           = useState('');
  const [transferType, setTransferType] = useState<TransferType>('standard');
  const [pin, setPin]                 = useState('');
  const [error, setError]             = useState('');
  const [micLoading, setMicLoading]   = useState(false);

  const allUsers = useMemo(() => getUsers().filter(u => u.id !== user?.id), [user]);

  const suggestions = useMemo(() => {
    if (!recipientInput || recipientInput.length < 1) return [];
    const q = recipientInput.toLowerCase().replace(/\D/g, '') || recipientInput.toLowerCase();
    return allUsers.filter(u =>
      u.fullName.toLowerCase().includes(recipientInput.toLowerCase()) ||
      u.accountNumber.includes(recipientInput) ||
      u.phone.replace(/\D/g,'').includes(q)
    ).slice(0, 4);
  }, [recipientInput, allUsers]);

  useEffect(() => {
    speak(L.send_to_account);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapMic = async () => {
    if (micLoading) { stopSpeaking(); setMicLoading(false); return; }
    setMicLoading(true);
    try {
      if (step === 'recipient') {
        const resp = await prompt(L.send_to_account);
        if (resp) { setRecipientInput(resp); }
      } else if (step === 'amount') {
        const resp = await prompt(L.send_how_much);
        if (resp) {
          const n = parseAmountFromSpeech(resp);
          if (n) setAmount(String(n));
        }
      }
    } catch { /* no mic */ }
    setMicLoading(false);
  };

  const selectSuggestion = (phone: string, name: string) => {
    setRecipientPhone(phone);
    setRecipientName(name);
    setRecipientInput(name);
    speak(L.send_confirm_account(phone));
  };

  const nextStep = async () => {
    setError('');
    if (step === 'recipient') {
      if (!recipientPhone && !recipientInput) { setError('Please enter a recipient'); return; }
      // If no suggestion selected, try by account number or phone
      if (!recipientPhone) {
        const found = allUsers.find(u => u.accountNumber === recipientInput || u.phone.replace(/\D/g,'') === recipientInput.replace(/\D/g,''));
        if (found) { setRecipientPhone(found.phone); setRecipientName(found.fullName); }
        else { setRecipientPhone(recipientInput); setRecipientName('External Account'); }
      }
      speak(L.send_how_much);
      setStep('amount');
    } else if (step === 'amount') {
      const n = parseFloat(amount.replace(/,/g,''));
      if (!n || n <= 0) { setError('Enter a valid amount'); return; }
      if (user && n > user.balance) { setError(L.send_insufficient); speak(L.send_insufficient); return; }
      speak(L.send_type_select);
      setStep('type');
    } else if (step === 'type') {
      speak(L.send_pin_prompt);
      setStep('pin');
    } else if (step === 'pin') {
      if (pin.length < 6) { setError('Enter your 6-digit PIN'); return; }
      if (pin !== user?.pin) { setError(L.login_wrong_pin); speak(L.login_wrong_pin); setPin(''); return; }
      setStep('confirm');
      await speak(`You are about to send ${formatNaira(parseFloat(amount))} to ${recipientName}. ${transferType === 'protected' ? L.send_protected_info : ''}`);
    } else if (step === 'confirm') {
      const n = parseFloat(amount.replace(/,/g,''));
      const ok = sendMoney(recipientPhone, n, transferType);
      if (ok) {
        setStep('done');
        speak(L.send_success(formatNaira(n), recipientName));
      } else {
        setError(L.send_insufficient);
      }
    }
  };

  if (!user) return null;

  const amountNum = parseFloat(amount.replace(/,/g,'')) || 0;

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #FF6B35)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-5">
          <button onClick={() => step === 'recipient' ? navigate('dashboard') : setStep((['recipient','recipient','amount','type','pin','confirm','done'] as Step[])[(['recipient','amount','type','pin','confirm','done','done'] as Step[]).indexOf(step)])}
                  className="text-white/80 text-sm p-2 -ml-2">← {L.back}</button>
          <h1 className="text-white font-bold text-lg flex-1">Send Money</h1>
          <MicButton onClick={tapMic} size="sm" />
        </div>
        {/* Progress */}
        <div className="flex gap-1 mx-4 mb-4">
          {(['recipient','amount','type','pin','confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
                 style={{ background: (['recipient','amount','type','pin','confirm','done'] as Step[]).indexOf(step) >= i ? '#00C27C' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      <div className="scroll-area">
        <div className="mt-4 animate-fade-in"><AmiraBubble /></div>

        <div className="mx-6 mt-4 animate-slide-up" key={step}>
          {step === 'recipient' && (
            <>
              <label className="block text-sm font-semibold text-ink-secondary mb-2">Send to</label>
              <input
                autoFocus
                value={recipientInput}
                onChange={e => { setRecipientInput(e.target.value); setRecipientPhone(''); setRecipientName(''); }}
                placeholder="Name, phone number, or account number"
                className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                style={{ borderColor: recipientPhone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
              />
              {/* Suggestions */}
              {suggestions.length > 0 && !recipientPhone && (
                <div className="bg-white rounded-2xl mt-2 card overflow-hidden">
                  {suggestions.map(u => (
                    <button key={u.id} onClick={() => selectSuggestion(u.phone, u.fullName)}
                            className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 active:bg-surface-light text-left"
                            style={{ borderColor: '#E4E9F2' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
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
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                     style={{ background: '#D6F5EA' }}>
                  <span className="text-brand-accent">✓</span>
                  <span className="text-sm font-semibold text-ink-primary">{recipientName}</span>
                  <span className="text-xs text-ink-muted ml-auto">{recipientPhone}</span>
                </div>
              )}
            </>
          )}

          {step === 'amount' && (
            <>
              <div className="bg-white rounded-2xl p-4 mb-4 card">
                <p className="text-xs text-ink-muted mb-1">Sending to</p>
                <p className="font-bold text-ink-primary">{recipientName}</p>
              </div>
              <label className="block text-sm font-semibold text-ink-secondary mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-ink-muted">₦</span>
                <input autoFocus value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))}
                       placeholder="0.00" type="number"
                       className="w-full pl-10 pr-4 py-5 rounded-2xl text-2xl font-bold border-2 transition-all"
                       style={{ borderColor: amount ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <p className="text-xs text-ink-muted mt-2">Available: {formatNaira(user.balance)}</p>
            </>
          )}

          {step === 'type' && (
            <>
              <p className="text-sm font-semibold text-ink-secondary mb-4">{L.send_type_select}</p>
              {([
                { type: 'standard' as TransferType, icon: '⚡', title: 'Send Immediately', desc: 'Funds arrive instantly. Cannot be recalled.' },
                { type: 'protected' as TransferType, icon: '🛡', title: 'Protected Payment', desc: 'Funds held securely until you confirm delivery.' },
              ]).map(opt => (
                <button key={opt.type} onClick={() => setTransferType(opt.type)}
                        className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 mb-3 text-left transition-all"
                        style={{
                          borderColor: transferType === opt.type ? '#00C27C' : '#CBD3E8',
                          background: transferType === opt.type ? '#D6F5EA' : '#fff',
                        }}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-ink-primary text-sm">{opt.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
                  </div>
                  {transferType === opt.type && <span className="text-brand-accent font-bold">✓</span>}
                </button>
              ))}
            </>
          )}

          {step === 'pin' && (
            <>
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
                   style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <span className="text-xl">🔒</span>
                <p className="text-sm" style={{ color: '#92600A' }}>{L.pin_security}</p>
              </div>
              <PinInput value={pin} onChange={setPin} error={!!error && pin.length > 0} />
            </>
          )}

          {step === 'confirm' && (
            <div className="bg-white rounded-2xl p-5 card">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Confirm Transfer</p>
              {[
                { label: 'To', value: recipientName },
                { label: 'Amount', value: formatNaira(amountNum) },
                { label: 'Type', value: transferType === 'protected' ? '🛡 Protected Payment' : '⚡ Immediate' },
                { label: 'Fee', value: '₦0.00 (demo)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
                  <span className="text-sm text-ink-muted">{label}</span>
                  <span className="text-sm font-bold text-ink-primary">{value}</span>
                </div>
              ))}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center pt-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
                   style={{ background: transferType === 'protected' ? 'rgba(245,166,35,0.15)' : '#D6F5EA' }}>
                {transferType === 'protected' ? '🛡' : '✓'}
              </div>
              <h2 className="text-xl font-black text-ink-primary mb-2">
                {transferType === 'protected' ? 'Payment Protected!' : 'Money Sent!'}
              </h2>
              <p className="text-sm text-ink-muted mb-1">{formatNaira(amountNum)} {transferType === 'protected' ? 'held securely for' : 'sent to'}</p>
              <p className="font-bold text-ink-primary mb-2">{recipientName}</p>
              {transferType === 'protected' && (
                <p className="text-xs text-ink-muted mb-4">Funds will be released when you confirm delivery.</p>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500 font-medium text-center animate-fade-in">{error}</p>}
        </div>

        {step !== 'done' && (
          <div className="mx-6 mt-4 mb-4">
            <button onClick={nextStep}
                    className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
              {step === 'confirm' ? `✓ Confirm — ${formatNaira(amountNum)}` : `${L.next} →`}
            </button>
          </div>
        )}
        {step === 'done' && (
          <div className="mx-6 mt-4">
            <button onClick={() => navigate('dashboard')}
                    className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
              Back to Home
            </button>
          </div>
        )}
        <div className="h-10" />
      </div>
    </div>
  );
}
