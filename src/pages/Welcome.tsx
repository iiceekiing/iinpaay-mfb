import { useState } from 'react';
import { useStore } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { VoiceToggle } from '../components/ui/VoiceToggle';
import { InpaayLogo } from '../assets/InpaayLogo';
import { LANG_OPTIONS, LANGS } from '../constants/langs';
import { detectIntent, isYes } from '../utils/intent';
import type { LangCode } from '../types';

export function Welcome() {
  const language       = useStore(s => s.language);
  const setLanguage    = useStore(s => s.setLanguage);
  const navigate       = useStore(s => s.navigate);
  const setAmiraText   = useStore(s => s.setAmiraText);
  const amiraDismissed = useStore(s => s.amiraDismissed);
  const dismissAmira   = useStore(s => s.dismissAmira);
  const restoreAmira   = useStore(s => s.restoreAmira);
  const voiceEnabled   = useStore(s => s.voiceEnabled);
  const { speak, converse, activateListen, stopSpeaking } = useAmira();

  const [phase, setPhase] = useState<'idle' | 'lang' | 'account'>('idle');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const L = LANGS[language];

  // ── Language quick-select (persistent button) ────────────────
  const handleLangSelect = async (lang: LangCode) => {
    setLanguage(lang);
    setShowLangPicker(false);
    const LN = LANGS[lang];
    setAmiraText(LN.have_account);
    setPhase('account');
    if (voiceEnabled) {
      const resp = await converse(LN.have_account, { listenMs: 12000 });
      if (resp) {
        if (isYes(resp) || detectIntent(resp) === 'LOGIN') navigate('login');
        else navigate('register');
      }
    }
  };

  // ── Mic button ────────────────────────────────────────────────
  const handleMicClick = async () => {
    if (amiraDismissed) { restoreAmira(); return; }
    stopSpeaking();

    setAmiraText(`${L.welcome} ${L.welcome_sub}`);
    setPhase('lang');

    if (voiceEnabled) {
      await speak(`${L.welcome} ${L.welcome_sub}`);
      const langResp = await converse(L.choose_lang, { listenMs: 12000 });
      if (langResp) {
        const lower = langResp.toLowerCase();
        if      (lower.includes('hausa')   || lower.includes('ha'))   setLanguage('ha');
        else if (lower.includes('yoruba')  || lower.includes('yor'))  setLanguage('yo');
        else if (lower.includes('igbo')    || lower.includes('ibo'))  setLanguage('ig');
        else                                                            setLanguage('en');
      }

      setPhase('account');
      const L2 = LANGS[language];
      const accountResp = await converse(L2.have_account, { listenMs: 12000 });
      if (accountResp) {
        const intent = detectIntent(accountResp);
        if (intent === 'YES' || intent === 'LOGIN') navigate('login');
        else navigate('register');
      }
    } else {
      setPhase('account');
    }
  };

  const listenForAccount = async () => {
    const L2 = LANGS[language];
    setAmiraText(L2.have_account);
    const resp = await converse(L2.have_account, { listenMs: 12000 });
    if (resp) {
      if (isYes(resp) || detectIntent(resp) === 'LOGIN') navigate('login');
      else navigate('register');
    }
  };

  return (
    <div
      className="phone-frame"
      style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3C8F 60%, #0D1B3E 100%)' }}
    >
      <div className="scroll-area flex flex-col items-center">

        {/* ── Language button — always visible at top ── */}
        <div className="w-full flex justify-end px-4 pt-12">
          <button
            onClick={() => setShowLangPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {LANG_OPTIONS.find(o => o.code === language)?.flag ?? '🌐'}
            <span>{LANG_OPTIONS.find(o => o.code === language)?.label ?? 'Language'}</span>
            <span className="opacity-60">{showLangPicker ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Language picker dropdown */}
        {showLangPicker && (
          <div className="w-full px-4 mt-2 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => handleLangSelect(opt.code)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl border transition-all active:scale-95"
                  style={{
                    background:  language === opt.code ? 'rgba(0,194,124,0.18)' : 'rgba(255,255,255,0.07)',
                    borderColor: language === opt.code ? 'rgba(0,194,124,0.55)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  <span className="text-xl">{opt.flag}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold">{opt.label}</div>
                    <div className="text-white/35 text-[10px]">{opt.native}</div>
                  </div>
                  {language === opt.code && <span className="ml-auto text-[#00C27C] text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center pt-6 pb-4 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3"
               style={{ background: '#fff', boxShadow: '0 8px 32px rgba(26,86,240,0.22)' }}>
            <InpaayLogo size={64} />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">INPAAY</span>
          <span className="text-[10px] font-medium text-white/35 tracking-widest uppercase mt-0.5">Financial Trust</span>
        </div>

        {/* Amira bubble */}
        {phase !== 'idle' && (
          <div className="w-full max-w-sm px-4 mb-5 animate-fade-in">
            <AmiraBubble />
          </div>
        )}

        {/* Intro text when idle */}
        {phase === 'idle' && !showLangPicker && (
          <div className="w-full max-w-sm px-5 mb-6 text-center animate-fade-in">
            <p className="text-white/60 text-sm leading-relaxed">{L.welcome_sub}</p>
            <p className="text-white/35 text-xs mt-2">{L.tap_mic}</p>
          </div>
        )}

        {/* Mic button */}
        {amiraDismissed ? (
          <AmiraReopenButton onReopen={restoreAmira} />
        ) : (
          <MicButton
            onClick={phase === 'account' ? listenForAccount : handleMicClick}
            onDismiss={dismissAmira}
            size="md"
            label="Amira"
          />
        )}

        {/* Language grid — shown when user taps mic (during onboarding) */}
        {phase === 'lang' && !showLangPicker && (
          <div className="w-full px-5 mt-6 animate-slide-up">
            <p className="text-center text-white/45 text-[11px] font-semibold mb-3 uppercase tracking-widest">
              {L.choose_lang}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => handleLangSelect(opt.code)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-95"
                  style={{
                    background:  language === opt.code ? 'rgba(0,194,124,0.15)' : 'rgba(255,255,255,0.06)',
                    borderColor: language === opt.code ? 'rgba(0,194,124,0.5)'  : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl">{opt.flag}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold">{opt.label}</div>
                    <div className="text-white/35 text-[10px]">{opt.native}</div>
                  </div>
                  {language === opt.code && <span className="ml-auto text-brand-accent text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account check buttons */}
        {phase === 'account' && (
          <div className="w-full px-5 mt-4 animate-slide-up">
            <p className="text-center text-white/45 text-[13px] mb-4">{L.have_account}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('login')}
                      className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                {L.yes}
              </button>
              <button onClick={() => navigate('register')}
                      className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 18px rgba(0,194,124,0.4)' }}>
                {L.no}
              </button>
            </div>
          </div>
        )}

        {/* Manual CTAs when idle */}
        {phase === 'idle' && (
          <div className="w-full px-5 mt-6 flex flex-col gap-3 animate-slide-up">
            <button onClick={() => navigate('register')}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 18px rgba(0,194,124,0.4)' }}>
              Create Account
            </button>
            <button onClick={() => navigate('login')}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              I Have an Account
            </button>
          </div>
        )}

        {/* Voice toggle */}
        <div className="w-full px-5 mt-6">
          <VoiceToggle compact />
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
