import { useState, useEffect } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { PinInput } from '../components/ui/PinInput';

export function Login() {
  const navigate = useStore(s => s.navigate);
  const login    = useStore(s => s.login);
  const L        = useLang();
  const { speak, prompt, stopSpeaking } = useAmira();

  const [phone, setPhone]   = useState('');
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [micLoading, setMicLoading] = useState(false);

  useEffect(() => {
    speak(L.login_phone_prompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapMic = async () => {
    if (micLoading) { stopSpeaking(); setMicLoading(false); return; }
    setMicLoading(true);
    setError('');
    try {
      if (!phone) {
        const resp = await prompt(L.login_phone_prompt);
        if (resp) {
          const digits = resp.replace(/\D/g, '');
          if (digits.length >= 10) { setPhone(digits); await speak(L.login_pin_prompt); }
          else { setError(L.not_understood); }
        }
      }
    } catch { /* no mic */ }
    setMicLoading(false);
  };

  const handleLogin = () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter a valid phone number'); return; }
    if (pin.length < 6)     { setError('Please enter your 6-digit PIN'); return; }

    const user = login(digits, pin);
    if (user) {
      speak(L.login_welcome_back(user.fullName));
      navigate('dashboard');
    } else {
      setError(L.login_wrong_pin);
      speak(L.login_wrong_pin);
      setPin('');
    }
  };

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button onClick={() => navigate('welcome')} className="text-white/70 text-sm p-2 -ml-2">
            ← {L.back}
          </button>
          <h1 className="text-white font-bold text-lg flex-1">Sign In</h1>
          <MicButton onClick={tapMic} size="sm" />
        </div>
      </div>

      <div className="scroll-area">
        <div className="mt-4 animate-fade-in">
          <AmiraBubble />
        </div>

        <div className="mx-6 mt-6 space-y-5 animate-slide-up">
          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-ink-secondary mb-2">{L.login_phone}</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onFocus={() => speak(L.login_phone_prompt)}
              placeholder="08031234567"
              type="tel"
              className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
              style={{ borderColor: phone ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-semibold text-ink-secondary mb-1">{L.login_pin}</label>
            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
                 style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <span className="text-base flex-shrink-0">🔒</span>
              <p className="text-xs text-amber-800">{L.pin_security}</p>
            </div>
            <PinInput value={pin} onChange={setPin} error={!!error && pin.length > 0} />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium animate-fade-in text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}
          >
            Sign In →
          </button>

          <button
            onClick={() => navigate('register')}
            className="w-full py-3 text-sm font-medium text-center"
            style={{ color: '#1A3C8F' }}
          >
            Don't have an account? Create one →
          </button>
        </div>
        <div className="h-10" />
      </div>
    </div>
  );
}
