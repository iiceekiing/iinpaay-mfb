import { useState, useEffect, useRef } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { parseMonth, parseNumberFromSpeech } from '../utils';
import { extractPhone } from '../utils/intent';

type Step = 'name' | 'dob_day' | 'dob_month' | 'dob_year' | 'gender' | 'phone' | 'pin';

const STEPS: Step[] = ['name', 'dob_day', 'dob_month', 'dob_year', 'gender', 'phone', 'pin'];

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  const pct = ((idx + 1) / STEPS.length) * 100;
  return (
    <div className="mx-6 mt-3 mb-1">
      <div className="h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#00C27C' }}
        />
      </div>
    </div>
  );
}

export function Register() {
  const navigate       = useStore(s => s.navigate);
  const register       = useStore(s => s.register);
  const amiraDismissed = useStore(s => s.amiraDismissed);
  const dismissAmira   = useStore(s => s.dismissAmira);
  const restoreAmira   = useStore(s => s.restoreAmira);
  const L              = useLang();
  const { speak, converse, stopSpeaking } = useAmira();

  const [step, setStep]       = useState<Step>('name');
  const [name, setName]       = useState('');
  const [day, setDay]         = useState('');
  const [month, setMonth]     = useState('');
  const [year, setYear]       = useState('');
  const [gender, setGender]   = useState<'male' | 'female' | ''>('');
  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const loopRef = useRef(false);

  // ── Auto-listen conversation per step ──────────────────────
  useEffect(() => {
    if (loopRef.current || amiraDismissed || step === 'pin') return;
    loopRef.current = true;

    async function listenForStep() {
      setError('');

      if (step === 'name') {
        const resp = await converse(L.reg_name_prompt, { listenMs: 10000 });
        if (resp && resp.trim().length >= 2) {
          setName(resp.trim());
          loopRef.current = false;
          setStep('dob_day');
        } else if (resp !== null) {
          setError(L.not_understood);
          await speak(L.not_understood);
          loopRef.current = false;
        } else {
          loopRef.current = false;
        }

      } else if (step === 'dob_day') {
        const resp = await converse(L.reg_day_prompt, { listenMs: 8000 });
        const n = resp ? parseNumberFromSpeech(resp) : null;
        if (n && n >= 1 && n <= 31) {
          setDay(String(n));
          loopRef.current = false;
          setStep('dob_month');
        } else {
          setError(L.not_understood);
          loopRef.current = false;
        }

      } else if (step === 'dob_month') {
        const resp = await converse(L.reg_month_prompt, { listenMs: 8000 });
        const m = resp ? parseMonth(resp) : null;
        if (m) {
          setMonth(String(m));
          loopRef.current = false;
          setStep('dob_year');
        } else {
          setError(L.not_understood);
          loopRef.current = false;
        }

      } else if (step === 'dob_year') {
        const resp = await converse(L.reg_year_prompt, { listenMs: 8000 });
        if (resp) {
          const digits = resp.replace(/\D/g, '');
          const y = parseInt(digits.slice(-4), 10);
          if (y > 1900 && y <= new Date().getFullYear()) {
            setYear(String(y));
            loopRef.current = false;
            setStep('gender');
          } else {
            setError(L.not_understood);
            loopRef.current = false;
          }
        } else {
          loopRef.current = false;
        }

      } else if (step === 'gender') {
        const resp = await converse(L.reg_gender_prompt, { listenMs: 8000 });
        if (resp) {
          const lower = resp.toLowerCase();
          const isMale   = ['male', 'man', 'boy', 'namiji', 'nwoke', 'akùnlẹ̀bọ'].some(w => lower.includes(w));
          const isFemale = ['female', 'woman', 'girl', 'mace', 'nwanyị', 'obìnrin'].some(w => lower.includes(w));
          if (isMale)        { setGender('male');   loopRef.current = false; setStep('phone'); }
          else if (isFemale) { setGender('female'); loopRef.current = false; setStep('phone'); }
          else               { setError(L.not_understood); loopRef.current = false; }
        } else {
          loopRef.current = false;
        }

      } else if (step === 'phone') {
        const resp = await converse(L.reg_phone_prompt, { listenMs: 10000 });
        const digits = extractPhone(resp ?? '');
        if (digits) {
          setPhone(digits);
          await speak(L.reg_pin_security);
          loopRef.current = false;
          setStep('pin');
        } else {
          setError(L.not_understood);
          loopRef.current = false;
        }
      }
    }

    listenForStep().catch(() => { loopRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, amiraDismissed]);

  // ── Manual next ────────────────────────────────────────────
  const nextStep = () => {
    setError('');
    if (step === 'name') {
      if (!name.trim()) { setError('Please enter your full name'); return; }
      speak(L.reg_day_prompt); setStep('dob_day');
    } else if (step === 'dob_day') {
      const n = parseInt(day, 10);
      if (!day || n < 1 || n > 31) { setError('Enter a valid day (1–31)'); return; }
      speak(L.reg_month_prompt); setStep('dob_month');
    } else if (step === 'dob_month') {
      const m = parseMonth(month);
      if (!m) { setError('Enter a valid month'); return; }
      setMonth(String(m)); speak(L.reg_year_prompt); setStep('dob_year');
    } else if (step === 'dob_year') {
      const y = parseInt(year, 10);
      if (!year || y < 1900 || y > new Date().getFullYear()) { setError('Enter a valid year'); return; }
      speak(L.reg_gender_prompt); setStep('gender');
    } else if (step === 'gender') {
      if (!gender) { setError('Please select your gender'); return; }
      speak(L.reg_phone_prompt); setStep('phone');
    } else if (step === 'phone') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) { setError('Enter a valid phone number (at least 10 digits)'); return; }
      speak(L.reg_pin_security); setStep('pin');
    } else if (step === 'pin') {
      if (pin.length < 6) { setError('Enter a 6-digit PIN'); return; }
      const m   = parseMonth(month) ?? 1;
      const dob = `${year}-${String(m).padStart(2, '0')}-${String(parseInt(day, 10)).padStart(2, '0')}`;
      const user = register({
        fullName:    name,
        dateOfBirth: dob,
        gender:      gender as 'male' | 'female',
        phone:       phone.replace(/\D/g, ''),
        pin,
      });
      speak(L.reg_success(user.fullName));
      navigate('dashboard');
    }
  };

  const LABELS: Record<Step, string> = {
    name: L.reg_name, dob_day: L.reg_day, dob_month: L.reg_month, dob_year: L.reg_year,
    gender: L.reg_gender, phone: L.reg_phone, pin: L.reg_pin,
  };

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => navigate('welcome')} className="text-white/60 text-sm p-2 -ml-2">
            ← {L.back}
          </button>
          <h1 className="text-white font-bold text-base flex-1">Create Account</h1>
          <div className="flex items-center gap-2">
            {amiraDismissed ? (
              <AmiraReopenButton onReopen={restoreAmira} />
            ) : (
              <MicButton
                onClick={() => { loopRef.current = false; }}
                onDismiss={dismissAmira}
                size="sm"
              />
            )}
          </div>
        </div>
        <ProgressBar step={step} />
      </div>

      <div className="scroll-area">
        {!amiraDismissed && (
          <div className="mt-4 animate-fade-in"><AmiraBubble /></div>
        )}

        <div className="mx-6 mt-4 mb-2">
          <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">{LABELS[step]}</p>
        </div>

        <div className="mx-6 animate-slide-up" key={step}>
          {/* Name */}
          {step === 'name' && (
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
                   onFocus={() => speak(L.reg_name_prompt)}
                   placeholder="e.g. Amara Okonkwo"
                   className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
                   style={{ borderColor: name ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
          )}

          {/* DOB */}
          {(step === 'dob_day' || step === 'dob_month' || step === 'dob_year') && (
            <div className="flex gap-3">
              {(['dob_day', 'dob_month', 'dob_year'] as Step[]).map((s, idx) => {
                const vals  = [day, month, year];
                const setrs = [setDay, setMonth, setYear];
                const labels = ['Day', 'Month', 'Year'];
                const prompts = [L.reg_day_prompt, L.reg_month_prompt, L.reg_year_prompt];
                return (
                  <div key={s} className="flex-1">
                    <label className="text-xs text-ink-muted mb-1 block">{labels[idx]}</label>
                    <input value={vals[idx]} onChange={e => setrs[idx]!(e.target.value)}
                           onFocus={() => speak(prompts[idx]!)}
                           placeholder={['15', '7', '1995'][idx]}
                           type="number"
                           className="w-full px-3 py-4 rounded-2xl border-2 text-center text-lg font-bold"
                           style={{ borderColor: vals[idx] ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Gender */}
          {step === 'gender' && (
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                        className="flex-1 py-5 rounded-2xl font-bold text-base border-2 transition-all active:scale-95"
                        style={{
                          borderColor: gender === g ? '#00C27C' : '#CBD3E8',
                          background:  gender === g ? '#D6F5EA' : '#fff',
                          color:       gender === g ? '#009962' : '#0D1B3E',
                        }}>
                  {g === 'male' ? '👨 ' + L.male : '👩 ' + L.female}
                </button>
              ))}
            </div>
          )}

          {/* Phone */}
          {step === 'phone' && (
            <input value={phone} onChange={e => setPhone(e.target.value)}
                   onFocus={() => speak(L.reg_phone_prompt)}
                   placeholder="e.g. 08031234567" type="tel"
                   className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
                   style={{ borderColor: phone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
          )}

          {/* PIN */}
          {step === 'pin' && (
            <div>
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
                   style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <span className="text-xl flex-shrink-0">🔒</span>
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
