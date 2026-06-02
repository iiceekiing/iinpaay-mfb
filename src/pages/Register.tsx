import { useState } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';
import { parseMonth, parseNumberFromSpeech } from '../utils';

type Step = 'name' | 'dob_day' | 'dob_month' | 'dob_year' | 'gender' | 'phone' | 'pin' | 'confirm';

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ['name','dob_day','dob_month','dob_year','gender','phone','pin','confirm'];
  const idx = steps.indexOf(step);
  const pct = ((idx + 1) / steps.length) * 100;
  return (
    <div className="mx-6 mt-4 mb-2">
      <div className="h-1.5 rounded-full bg-edge-light overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00C27C, #00E89A)' }} />
      </div>
      <p className="text-xs text-ink-muted mt-1 text-right">{idx + 1} of {steps.length}</p>
    </div>
  );
}

export function Register() {
  const navigate   = useStore(s => s.navigate);
  const register   = useStore(s => s.register);
  const L          = useLang();
  const { speak, listen, prompt, stopSpeaking } = useAmira();

  const [step, setStep]       = useState<Step>('name');
  const [name, setName]       = useState('');
  const [day, setDay]         = useState('');
  const [month, setMonth]     = useState('');
  const [year, setYear]       = useState('');
  const [gender, setGender]   = useState<'male' | 'female' | ''>('');
  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [micLoading, setMicLoading] = useState(false);

  const setStepAndSpeak = async (s: Step, text: string) => {
    setStep(s);
    await speak(text);
  };

  const tapMic = async () => {
    if (micLoading) { stopSpeaking(); setMicLoading(false); return; }
    setMicLoading(true);
    setError('');

    try {
      if (step === 'name') {
        const resp = await prompt(L.reg_name_prompt);
        if (resp && resp.length > 1) { setName(resp); await setStepAndSpeak('dob_day', L.reg_day_prompt); }
        else { setError(L.not_understood); await speak(L.not_understood); }
      } else if (step === 'dob_day') {
        const resp = await prompt(L.reg_day_prompt);
        const n = resp ? parseNumberFromSpeech(resp) : null;
        if (n && n >= 1 && n <= 31) { setDay(String(n)); await setStepAndSpeak('dob_month', L.reg_month_prompt); }
        else { setError(L.not_understood); await speak(L.not_understood); }
      } else if (step === 'dob_month') {
        const resp = await prompt(L.reg_month_prompt);
        const m = resp ? parseMonth(resp) : null;
        if (m) { setMonth(String(m)); await setStepAndSpeak('dob_year', L.reg_year_prompt); }
        else { setError(L.not_understood); await speak(L.not_understood); }
      } else if (step === 'dob_year') {
        const resp = await prompt(L.reg_year_prompt);
        if (resp) {
          const digits = resp.replace(/\D/g, '');
          const y = parseInt(digits.slice(-4), 10);
          if (y > 1900 && y <= new Date().getFullYear()) {
            setYear(String(y)); await setStepAndSpeak('gender', L.reg_gender_prompt);
          } else { setError(L.not_understood); await speak(L.not_understood); }
        }
      } else if (step === 'gender') {
        const resp = await prompt(L.reg_gender_prompt);
        if (resp) {
          const lower = resp.toLowerCase();
          const isMale = ['male','man','boy','namiji','nwoke','akùnlẹ̀bọ'].some(w => lower.includes(w));
          const isFemale = ['female','woman','girl','mace','nwanyị','obìnrin'].some(w => lower.includes(w));
          if (isMale) { setGender('male'); await setStepAndSpeak('phone', L.reg_phone_prompt); }
          else if (isFemale) { setGender('female'); await setStepAndSpeak('phone', L.reg_phone_prompt); }
          else { setError(L.not_understood); await speak(L.not_understood); }
        }
      } else if (step === 'phone') {
        const resp = await prompt(L.reg_phone_prompt);
        if (resp) {
          const digits = resp.replace(/\D/g, '');
          if (digits.length >= 10) {
            setPhone(digits); await speak(L.reg_pin_security); setStep('pin');
          } else { setError(L.not_understood); await speak(L.not_understood); }
        }
      } else if (step === 'confirm') {
        await speak(L.reg_success(name));
      }
    } catch { setError(L.not_understood); }
    setMicLoading(false);
  };

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
      const dob = `${year}-${String(parseMonth(month) ?? 1).padStart(2,'0')}-${String(parseInt(day,10)).padStart(2,'0')}`;
      const user = register({
        fullName: name,
        dateOfBirth: dob,
        gender: gender as 'male' | 'female',
        phone: phone.replace(/\D/g, ''),
        pin,
      });
      speak(L.reg_success(user.fullName));
      navigate('dashboard');
    }
  };

  // Field label mapping
  const labels: Record<Step, string> = {
    name: L.reg_name, dob_day: L.reg_day, dob_month: L.reg_month, dob_year: L.reg_year,
    gender: L.reg_gender, phone: L.reg_phone, pin: L.reg_pin, confirm: 'Summary',
  };

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button onClick={() => navigate('welcome')} className="text-white/70 text-sm p-2 -ml-2">
            ← {L.back}
          </button>
          <h1 className="text-white font-bold text-lg flex-1">Create Account</h1>
          <MicButton onClick={tapMic} size="sm" />
        </div>
        <ProgressBar step={step} />
      </div>

      <div className="scroll-area">
        {/* Amira guidance */}
        <div className="mt-4 animate-fade-in">
          <AmiraBubble />
        </div>

        {/* Step label */}
        <div className="mx-6 mt-5 mb-3">
          <p className="text-xs font-bold text-brand-accent uppercase tracking-wider mb-1">{labels[step]}</p>
        </div>

        {/* Step-specific UI */}
        <div className="mx-6 animate-slide-up" key={step}>

          {step === 'name' && (
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => speak(L.reg_name_prompt)}
              placeholder="e.g. Amara Okonkwo"
              className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
              style={{ borderColor: name ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
            />
          )}

          {(step === 'dob_day' || step === 'dob_month' || step === 'dob_year') && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-ink-muted mb-1 block">Day</label>
                <input value={day} onChange={e => setDay(e.target.value)} onFocus={() => speak(L.reg_day_prompt)}
                       placeholder="e.g. 15" type="number" min="1" max="31"
                       className="w-full px-4 py-4 rounded-2xl border-2 text-center text-xl font-bold"
                       style={{ borderColor: day ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-muted mb-1 block">Month</label>
                <input value={month} onChange={e => setMonth(e.target.value)} onFocus={() => speak(L.reg_month_prompt)}
                       placeholder="e.g. 7"
                       className="w-full px-4 py-4 rounded-2xl border-2 text-center text-xl font-bold"
                       style={{ borderColor: month ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-muted mb-1 block">Year</label>
                <input value={year} onChange={e => setYear(e.target.value)} onFocus={() => speak(L.reg_year_prompt)}
                       placeholder="e.g. 1995" type="number"
                       className="w-full px-4 py-4 rounded-2xl border-2 text-center text-xl font-bold"
                       style={{ borderColor: year ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
            </div>
          )}

          {step === 'gender' && (
            <div className="flex gap-3">
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                        className="flex-1 py-5 rounded-2xl font-bold text-base border-2 transition-all"
                        style={{
                          borderColor: gender === g ? '#00C27C' : '#CBD3E8',
                          background: gender === g ? '#D6F5EA' : '#fff',
                          color: gender === g ? '#009962' : '#0D1B3E',
                        }}>
                  {g === 'male' ? '👨 ' + L.male : '👩 ' + L.female}
                </button>
              ))}
            </div>
          )}

          {step === 'phone' && (
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onFocus={() => speak(L.reg_phone_prompt)}
              placeholder="e.g. 08031234567"
              type="tel"
              className="w-full px-4 py-4 rounded-2xl text-base font-medium border-2 transition-all"
              style={{ borderColor: phone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
            />
          )}

          {step === 'pin' && (
            <div>
              {/* Security reminder */}
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
                   style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <span className="text-xl flex-shrink-0">🔒</span>
                <p className="text-sm text-amber-800">{L.pin_security}</p>
              </div>
              <PinInput value={pin} onChange={setPin} error={!!error} />
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-500 font-medium animate-fade-in">{error}</p>
          )}
        </div>

        {/* Next button */}
        <div className="mx-6 mt-6 mb-4">
          <button
            onClick={nextStep}
            className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}
          >
            {step === 'pin' ? '✓ Create Account' : L.next + ' →'}
          </button>
          {step !== 'name' && (
            <button onClick={() => { setError(''); speak(''); setStep((['name','name','dob_day','dob_month','dob_year','gender','phone','pin'] as Step[])[(['name','dob_day','dob_month','dob_year','gender','phone','pin','confirm'] as Step[]).indexOf(step)]); }}
                    className="w-full py-3 mt-2 text-sm font-medium text-ink-muted">
              ← {L.back}
            </button>
          )}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
