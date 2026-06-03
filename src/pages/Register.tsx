import { useEffect, useState } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { useVoiceGuide } from '../hooks/useVoiceGuide';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { InpaayLogo } from '../assets/InpaayLogo';
import { parseMonth, parseNumberFromSpeech, generateAccountNumber } from '../utils';
import { extractPhone } from '../utils/intent';

type Step = 'name' | 'dob_day' | 'dob_month' | 'dob_year' | 'gender' | 'phone' | 'pin';
const STEP_ORDER: Step[] = ['name','dob_day','dob_month','dob_year','gender','phone','pin'];

function ProgressBar({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step);
  const pct = ((idx + 1) / STEP_ORDER.length) * 100;
  return (
    <div className="mx-6 mt-2 mb-1">
      <div className="h-1 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${pct}%`, background: '#00C27C' }} />
      </div>
    </div>
  );
}

export function Register() {
  const navigate       = useStore(s => s.navigate);
  const register       = useStore(s => s.register);
  const setAmiraText   = useStore(s => s.setAmiraText);
  const amiraDismissed = useStore(s => s.amiraDismissed);
  const dismissAmira   = useStore(s => s.dismissAmira);
  const restoreAmira   = useStore(s => s.restoreAmira);
  const voiceEnabled   = useStore(s => s.voiceEnabled);
  const L              = useLang();
  const { speak, converse, stopSpeaking } = useAmira();
  const { announceField, announcePage }   = useVoiceGuide();

  const [step, setStep]     = useState<Step>('name');
  const [name, setName]     = useState('');
  const [day, setDay]       = useState('');
  const [month, setMonth]   = useState('');
  const [year, setYear]     = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [phone, setPhone]   = useState('');
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [micBusy, setMicBusy] = useState(false);

  // Announce the page once on mount
  useEffect(() => {
    announcePage('Let\'s create your INPAAY account. Please fill in your details.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PROMPTS: Record<Step, string> = {
    name:      L.reg_name_prompt,
    dob_day:   L.reg_day_prompt,
    dob_month: L.reg_month_prompt,
    dob_year:  L.reg_year_prompt,
    gender:    L.reg_gender_prompt,
    phone:     L.reg_phone_prompt,
    pin:       L.reg_pin_prompt,
  };

  const LABELS: Record<Step, string> = {
    name:'Full Name', dob_day:'Day of Birth', dob_month:'Month of Birth',
    dob_year:'Year of Birth', gender:'Gender', phone:'Phone Number', pin:'Transfer PIN',
  };

  // ── Mic tap — voice interaction for current step ──────────────
  const handleMicClick = async () => {
    if (micBusy) { stopSpeaking(); setMicBusy(false); return; }
    if (step === 'pin') return;

    setMicBusy(true);
    setError('');
    setAmiraText(PROMPTS[step]);

    try {
      const resp = await converse(PROMPTS[step], {
        listenMs:    15000,
        maxRetries:  2,
        retryPrompt: `${L.retry_prompt} ${PROMPTS[step]}`,
      });

      if (!resp) { setMicBusy(false); return; }

      if (step === 'name') {
        if (resp.trim().length >= 2) { setName(resp.trim()); advanceStep(); }
        else { setError(L.not_understood); await speak(L.not_understood); }

      } else if (step === 'dob_day') {
        const n = parseNumberFromSpeech(resp);
        if (n && n >= 1 && n <= 31) { setDay(String(n)); advanceStep(); }
        else { setError(L.not_understood); }

      } else if (step === 'dob_month') {
        const m = parseMonth(resp);
        if (m) { setMonth(String(m)); advanceStep(); }
        else { setError(L.not_understood); }

      } else if (step === 'dob_year') {
        const digits = resp.replace(/\D/g, '');
        const y = parseInt(digits.slice(-4), 10);
        if (y > 1900 && y <= new Date().getFullYear()) { setYear(String(y)); advanceStep(); }
        else { setError(L.not_understood); }

      } else if (step === 'gender') {
        const lower = resp.toLowerCase();
        const isMale   = ['male','man','boy','namiji','nwoke'].some(w => lower.includes(w));
        const isFemale = ['female','woman','girl','mace','nwanyị'].some(w => lower.includes(w));
        if (isMale)        { setGender('male');   advanceStep(); }
        else if (isFemale) { setGender('female'); advanceStep(); }
        else               { setError(L.not_understood); }

      } else if (step === 'phone') {
        const digits = extractPhone(resp);
        if (digits) {
          setPhone(digits);
          setAmiraText(L.reg_pin_security);
          await speak(L.reg_pin_security);
          setStep('pin');
        } else { setError(L.not_understood); }
      }
    } catch { /* mic unavailable */ }

    setMicBusy(false);
  };

  const advanceStep = () => {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[idx + 1];
    if (next) { setStep(next); setError(''); }
  };

  // ── Manual next ────────────────────────────────────────────────
  const nextStep = () => {
    setError('');
    if (step === 'name') {
      if (!name.trim()) { setError('Enter your full name'); return; }
      if (voiceEnabled) speak(L.reg_day_prompt); else setAmiraText(L.reg_day_prompt);
      setStep('dob_day');
    } else if (step === 'dob_day') {
      const n = parseInt(day, 10);
      if (!day || n < 1 || n > 31) { setError('Enter a valid day (1–31)'); return; }
      if (voiceEnabled) speak(L.reg_month_prompt); else setAmiraText(L.reg_month_prompt);
      setStep('dob_month');
    } else if (step === 'dob_month') {
      const m = parseMonth(month);
      if (!m) { setError('Enter a valid month'); return; }
      setMonth(String(m));
      if (voiceEnabled) speak(L.reg_year_prompt); else setAmiraText(L.reg_year_prompt);
      setStep('dob_year');
    } else if (step === 'dob_year') {
      const y = parseInt(year, 10);
      if (!year || y < 1900 || y > new Date().getFullYear()) { setError('Enter a valid year'); return; }
      if (voiceEnabled) speak(L.reg_gender_prompt); else setAmiraText(L.reg_gender_prompt);
      setStep('gender');
    } else if (step === 'gender') {
      if (!gender) { setError('Select your gender'); return; }
      if (voiceEnabled) speak(L.reg_phone_prompt); else setAmiraText(L.reg_phone_prompt);
      setStep('phone');
    } else if (step === 'phone') {
      if (phone.replace(/\D/g, '').length < 10) { setError('Enter a valid phone number (10+ digits)'); return; }
      setAmiraText(L.reg_pin_security);
      if (voiceEnabled) speak(L.reg_pin_security);
      setStep('pin');
    } else if (step === 'pin') {
      if (pin.length < 6) { setError('Enter a 6-digit PIN'); return; }
      const m   = parseMonth(month) ?? 1;
      const dob = `${year}-${String(m).padStart(2,'0')}-${String(parseInt(day,10)).padStart(2,'0')}`;
      const user = register({
        fullName: name, dateOfBirth: dob,
        gender: gender as 'male' | 'female',
        phone: phone.replace(/\D/g, ''), pin,
      });
      if (voiceEnabled) speak(L.reg_success(user.fullName));
      navigate('dashboard');
    }
  };

  // Computed account number preview from phone
  const accountPreview = phone.replace(/\D/g, '').length >= 10
    ? generateAccountNumber(phone.replace(/\D/g, ''))
    : null;

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => navigate('welcome')} className="text-white/60 text-sm p-2 -ml-2">← {L.back}</button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fff' }}>
              <InpaayLogo size={22} />
            </div>
            <h1 className="text-white font-bold text-base">Create Account</h1>
          </div>
          {amiraDismissed ? (
            <AmiraReopenButton onReopen={restoreAmira} />
          ) : step !== 'pin' ? (
            <MicButton onClick={handleMicClick} onDismiss={dismissAmira} size="sm" />
          ) : null}
        </div>
        <ProgressBar step={step} />
      </div>

      <div className="scroll-area">
        {/* Amira guidance */}
        <div className="mt-4">
          <AmiraBubble
            text={amiraDismissed ? undefined : PROMPTS[step]}
            compact={false}
          />
        </div>

        <div className="mx-6 mt-4 mb-1.5">
          <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">{LABELS[step]}</p>
        </div>

        <div className="mx-6 animate-slide-up" key={step}>
          {step === 'name' && (
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => announceField('Full Name', L.reg_name_prompt)}
              placeholder="e.g. Amara Okonkwo"
              className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
              style={{ borderColor: name ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
            />
          )}

          {(step === 'dob_day' || step === 'dob_month' || step === 'dob_year') && (
            <div className="flex gap-3">
              {(['Day','Month','Year'] as const).map((lbl, idx) => {
                const vals  = [day, month, year];
                const setrs = [setDay, setMonth, setYear];
                const prompts = [L.reg_day_prompt, L.reg_month_prompt, L.reg_year_prompt];
                return (
                  <div key={lbl} className="flex-1">
                    <label className="text-xs text-ink-muted mb-1 block">{lbl}</label>
                    <input
                      value={vals[idx]}
                      onChange={e => setrs[idx]!(e.target.value)}
                      onFocus={() => announceField(lbl, prompts[idx]!)}
                      placeholder={['15','7','1995'][idx]}
                      type="number"
                      className="w-full px-3 py-4 rounded-2xl border-2 text-center text-lg font-bold"
                      style={{ borderColor: vals[idx] ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {step === 'gender' && (
            <div className="flex gap-3">
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                        className="flex-1 py-5 rounded-2xl font-bold text-base border-2 transition-all active:scale-95"
                        style={{ borderColor:gender===g?'#00C27C':'#CBD3E8', background:gender===g?'#D6F5EA':'#fff', color:gender===g?'#009962':'#0D1B3E' }}>
                  {g === 'male' ? '👨 ' + L.male : '👩 ' + L.female}
                </button>
              ))}
            </div>
          )}

          {step === 'phone' && (
            <>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={() => announceField('Phone Number', L.reg_phone_prompt)}
                placeholder="e.g. 08031234567"
                type="tel"
                className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
                style={{ borderColor: phone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
              />
              {accountPreview && (
                <div className="mt-2 px-4 py-2 rounded-xl flex items-center gap-2"
                     style={{ background: 'rgba(0,194,124,0.08)', border: '1px solid rgba(0,194,124,0.2)' }}>
                  <span className="text-xs text-ink-muted">Your account number:</span>
                  <span className="text-sm font-bold font-mono text-brand-accent tracking-widest">{accountPreview}</span>
                </div>
              )}
            </>
          )}

          {step === 'pin' && (
            <div>
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
                   style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <span className="text-xl">🔒</span>
                <p className="text-sm" style={{ color: '#92600A' }}>{L.pin_security}</p>
              </div>
              <PinInput value={pin} onChange={setPin} error={!!error} />
            </div>
          )}

          {error && <p className="mt-3 text-sm font-medium text-red-500 animate-fade-in">{error}</p>}
        </div>

        <div className="mx-6 mt-5 mb-4">
          <button onClick={nextStep}
                  className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 18px rgba(0,194,124,0.35)' }}>
            {step === 'pin' ? '✓ Create Account' : L.next + ' →'}
          </button>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
