import { useState, useEffect } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { formatNaira, parseAmountFromSpeech } from '../utils';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export function AddMoney() {
  const user      = useStore(s => s.currentUser);
  const addMoney  = useStore(s => s.addMoney);
  const navigate  = useStore(s => s.navigate);
  const L         = useLang();
  const { speak, prompt, stopSpeaking } = useAmira();

  const [amount, setAmount]   = useState('');
  const [step, setStep]       = useState<'input' | 'details' | 'done'>('input');
  const [error, setError]     = useState('');
  const [micLoading, setMicLoading] = useState(false);

  useEffect(() => {
    speak(L.add_how_much);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapMic = async () => {
    if (micLoading) { stopSpeaking(); setMicLoading(false); return; }
    setMicLoading(true);
    setError('');
    try {
      const resp = await prompt(L.add_how_much);
      if (resp) {
        const n = parseAmountFromSpeech(resp);
        if (n && n > 0) setAmount(String(n));
        else { setError(L.not_understood); }
      }
    } catch { /* no mic */ }
    setMicLoading(false);
  };

  const proceed = () => {
    const n = parseFloat(amount.replace(/,/g, ''));
    if (!n || n <= 0) { setError('Please enter a valid amount'); return; }
    setError('');
    setStep('details');
    speak(L.add_account_details);
  };

  const confirmAdd = () => {
    const n = parseFloat(amount.replace(/,/g, ''));
    addMoney(n, `Account funded — ${formatNaira(n)}`);
    setStep('done');
    speak(L.add_success(formatNaira(n)));
  };

  if (!user) return null;

  return (
    <div className="phone-frame bg-surface-light">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #009962, #00C27C)' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-5">
          <button onClick={() => navigate('dashboard')} className="text-white/80 text-sm p-2 -ml-2">← {L.back}</button>
          <h1 className="text-white font-bold text-lg flex-1">Add Money</h1>
          <MicButton onClick={tapMic} size="sm" />
        </div>
      </div>

      <div className="scroll-area">
        <div className="mt-4 animate-fade-in">
          <AmiraBubble />
        </div>

        {step === 'input' && (
          <div className="mx-6 mt-5 animate-slide-up">
            <label className="block text-sm font-semibold text-ink-secondary mb-2">Amount to add</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-ink-muted">₦</span>
              <input
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))}
                placeholder="0.00"
                type="number"
                className="w-full pl-10 pr-4 py-5 rounded-2xl text-2xl font-bold border-2 transition-all"
                style={{ borderColor: amount ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }}
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                        className="py-3 rounded-xl font-semibold text-sm border transition-all active:scale-95"
                        style={{
                          borderColor: amount === String(a) ? '#00C27C' : '#CBD3E8',
                          background: amount === String(a) ? '#D6F5EA' : '#fff',
                          color: amount === String(a) ? '#009962' : '#0D1B3E',
                        }}>
                  {formatNaira(a)}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>}

            <button onClick={proceed}
                    className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary mt-5 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
              Continue →
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="mx-6 mt-5 animate-slide-up">
            <div className="bg-white rounded-2xl p-5 card mb-4">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Transfer to this account</p>
              {[
                { label: 'Account Number', value: user.accountNumber },
                { label: 'Account Name', value: user.fullName },
                { label: 'Amount', value: formatNaira(parseFloat(amount)) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
                  <span className="text-sm text-ink-muted">{label}</span>
                  <span className="text-sm font-bold text-ink-primary">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted text-center mb-4">
              In a real scenario, you would transfer funds to this account. For this demo, tap the button below to simulate funding.
            </p>
            <button onClick={confirmAdd}
                    className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
              ✓ Simulate Funding
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="mx-6 mt-8 text-center animate-slide-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
                 style={{ background: '#D6F5EA' }}>✓</div>
            <h2 className="text-xl font-black text-ink-primary mb-2">Money Added!</h2>
            <p className="text-sm text-ink-muted mb-2">{formatNaira(parseFloat(amount))} added to your account.</p>
            <p className="text-lg font-bold text-brand-accent mb-6">{formatNaira(user.balance)}</p>
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
