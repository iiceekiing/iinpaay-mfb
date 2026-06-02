import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { LANG_OPTIONS, LANGS } from '../constants/langs';
import type { LangCode } from '../types';

export function Welcome() {
  const language     = useStore(s => s.language);
  const setLanguage  = useStore(s => s.setLanguage);
  const navigate     = useStore(s => s.navigate);
  const setAmiraText = useStore(s => s.setAmiraText);
  const { speak, prompt, stopSpeaking } = useAmira();
  const L = LANGS[language];

  const [phase, setPhase] = useState<'greeting' | 'lang' | 'account'>('greeting');
  const [micActive, setMicActive] = useState(false);
  const [showLangGrid, setShowLangGrid] = useState(false);

  // Auto-greet on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAmiraText(`${L.welcome} ${L.welcome_sub}`);
      speak(`${L.welcome} ${L.welcome_sub}`).then(() => {
        setPhase('lang');
        setShowLangGrid(true);
      });
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectLanguage = async (lang: LangCode) => {
    setLanguage(lang);
    const LNew = LANGS[lang];
    await speak(LNew.choose_lang, );
    setPhase('account');
    setShowLangGrid(false);
    await handleAccountCheck(lang);
  };

  const handleAccountCheck = async (lang: LangCode) => {
    const LNew = LANGS[lang];
    setAmiraText(LNew.have_account);
    speak(LNew.have_account);
  };

  const handleMicClick = async () => {
    if (micActive) { stopSpeaking(); setMicActive(false); return; }
    setMicActive(true);

    if (phase === 'greeting' || phase === 'lang') {
      await speak(L.choose_lang);
      setPhase('lang');
      setShowLangGrid(true);
      setMicActive(false);
      return;
    }

    if (phase === 'account') {
      try {
        const resp = await prompt(L.have_account);
        if (resp) {
          const lower = resp.toLowerCase();
          const isYes = ['yes', 'yeah', 'yep', 'ya', 'sure', 'eh', 'ee', 'bẹ́ẹ̀'].some(w => lower.includes(w));
          navigate(isYes ? 'login' : 'register');
        }
      } catch { /* no mic access, let user tap buttons */ }
    }
    setMicActive(false);
  };

  return (
    <div className="phone-frame" style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3C8F 60%, #0D1B3E 100%)' }}>
      <div className="scroll-area flex flex-col items-center">

        {/* Logo */}
        <div className="flex flex-col items-center pt-16 pb-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
               style={{ background: 'rgba(0,194,124,0.15)', border: '1.5px solid rgba(0,194,124,0.4)' }}>
            <span className="text-3xl font-black text-brand-accent" style={{ fontFamily: 'DM Sans' }}>ii</span>
          </div>
          <span className="text-3xl font-black text-white tracking-tight">iinpaay</span>
          <span className="text-xs font-medium text-white/40 tracking-widest uppercase mt-1">Financial Trust</span>
        </div>

        {/* Amira bubble */}
        <div className="w-full max-w-[360px] px-4 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <AmiraBubble />
        </div>

        {/* Mic button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <MicButton onClick={handleMicClick} size="lg" />
          <p className="text-center text-white/40 text-xs mt-3">{L.tap_mic}</p>
        </div>

        {/* Language grid */}
        {showLangGrid && (
          <div className="w-full px-6 mt-8 animate-slide-up">
            <p className="text-center text-white/60 text-xs font-medium mb-4 uppercase tracking-wider">
              {L.choose_lang}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => selectLanguage(opt.code)}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all active:scale-95"
                  style={{
                    background: language === opt.code ? 'rgba(0,194,124,0.15)' : 'rgba(255,255,255,0.06)',
                    borderColor: language === opt.code ? 'rgba(0,194,124,0.5)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl">{opt.flag}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold">{opt.label}</div>
                    <div className="text-white/40 text-xs">{opt.native}</div>
                  </div>
                  {language === opt.code && <span className="ml-auto text-brand-accent text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account check buttons */}
        {phase === 'account' && !showLangGrid && (
          <div className="w-full px-6 mt-6 animate-slide-up">
            <p className="text-center text-white/60 text-sm mb-5">{L.have_account}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('login')}
                      className="flex-1 py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                {L.yes} 👋
              </button>
              <button onClick={() => navigate('register')}
                      className="flex-1 py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 20px rgba(0,194,124,0.4)' }}>
                {L.no} ✨
              </button>
            </div>
          </div>
        )}

        {/* Manual buttons when in lang phase */}
        {phase !== 'account' && !showLangGrid && (
          <div className="w-full px-6 mt-8 flex flex-col gap-3 animate-slide-up">
            <button onClick={() => navigate('register')}
                    className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.4)' }}>
              Create Account
            </button>
            <button onClick={() => navigate('login')}
                    className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              I Have an Account
            </button>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
