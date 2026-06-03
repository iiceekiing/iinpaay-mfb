import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
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
  const { speak, converse, stopSpeaking } = useAmira();

  const [showLangGrid, setShowLangGrid]  = useState(false);
  const [showAccountQ, setShowAccountQ]  = useState(false);
  const conversationRef = useRef(false);   // guard: only one loop at a time

  const L = LANGS[language];

  // ── Auto-start conversation on mount ────────────────────────
  useEffect(() => {
    if (conversationRef.current) return;
    conversationRef.current = true;

    async function startConversation() {
      // Step 1: Welcome greeting + show language grid
      setAmiraText(`${L.welcome} ${L.welcome_sub} ${L.tap_mic}`);
      await speak(`${L.welcome} ${L.welcome_sub}`);
      setShowLangGrid(true);

      // Step 2: Ask which language (auto-listen)
      const langResp = await converse(L.choose_lang, { listenMs: 12000, pauseMs: 300 });

      if (langResp) {
        // Detect language from the response
        const lower = langResp.toLowerCase();
        let selected: LangCode = language;
        if (lower.includes('hausa') || lower.includes('ha'))    selected = 'ha';
        else if (lower.includes('yoruba') || lower.includes('yo') || lower.includes('yor')) selected = 'yo';
        else if (lower.includes('igbo')  || lower.includes('ig') || lower.includes('ibo'))  selected = 'ig';
        else if (lower.includes('english') || lower.includes('en'))  selected = 'en';

        if (selected !== language) setLanguage(selected);
      }

      setShowLangGrid(false);

      // Step 3: Account check (auto-listen)
      const currentL = LANGS[language]; // may have changed
      setShowAccountQ(true);
      const accountResp = await converse(currentL.have_account, { listenMs: 10000, pauseMs: 400 });

      if (accountResp) {
        const intent = detectIntent(accountResp);
        if (intent === 'YES' || intent === 'LOGIN') {
          await speak(currentL.yes + '!');
          navigate('login');
        } else if (intent === 'NO' || intent === 'REGISTER') {
          await speak(currentL.no + '!');
          navigate('register');
        } else {
          // Unclear — re-ask once
          const retry = await converse(currentL.say_yes_no, { listenMs: 8000 });
          if (retry && (isYes(retry) || detectIntent(retry) === 'LOGIN')) navigate('login');
          else navigate('register');
        }
      }
      // If null (no speech), let user tap buttons — fall through
    }

    startConversation().catch(() => {
      setShowLangGrid(true);
      setShowAccountQ(true);
    });

    return () => { conversationRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual mic tap (re-triggers Amira when user wants to speak) ──
  const tapMic = async () => {
    if (amiraDismissed) { restoreAmira(); return; }
    stopSpeaking();
    setShowAccountQ(true);
    const L2 = LANGS[language];
    const resp = await converse(L2.have_account, { listenMs: 10000 });
    if (resp) {
      if (isYes(resp) || detectIntent(resp) === 'LOGIN') navigate('login');
      else navigate('register');
    }
  };

  const selectLanguage = async (lang: LangCode) => {
    setLanguage(lang);
    const LN = LANGS[lang];
    setShowLangGrid(false);
    setShowAccountQ(true);
    await speak(LN.choose_lang);
    const resp = await converse(LN.have_account, { listenMs: 10000 });
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
        {/* Logo */}
        <div className="flex flex-col items-center pt-14 pb-4 animate-fade-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{ background: 'rgba(0,194,124,0.12)', border: '1.5px solid rgba(0,194,124,0.35)' }}
          >
            <span className="text-2xl font-black text-brand-accent" style={{ fontFamily: 'DM Sans' }}>ii</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">iinpaay</span>
          <span className="text-[10px] font-medium text-white/35 tracking-widest uppercase mt-0.5">Financial Trust</span>
        </div>

        {/* Amira bubble */}
        <div className="w-full max-w-sm px-4 mb-5 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <AmiraBubble />
        </div>

        {/* Mic button — dismiss-aware */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {amiraDismissed ? (
            <div className="flex flex-col items-center gap-3">
              <AmiraReopenButton onReopen={restoreAmira} />
            </div>
          ) : (
            <MicButton
              onClick={tapMic}
              onDismiss={dismissAmira}
              size="md"
              label="Amira"
            />
          )}
        </div>

        {/* Language selection grid */}
        {showLangGrid && !amiraDismissed && (
          <div className="w-full px-5 mt-6 animate-slide-up">
            <p className="text-center text-white/50 text-[11px] font-semibold mb-3 uppercase tracking-widest">
              {L.choose_lang}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => selectLanguage(opt.code)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-95"
                  style={{
                    background:   language === opt.code ? 'rgba(0,194,124,0.15)' : 'rgba(255,255,255,0.06)',
                    borderColor:  language === opt.code ? 'rgba(0,194,124,0.5)'  : 'rgba(255,255,255,0.1)',
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
        {showAccountQ && (
          <div className="w-full px-5 mt-5 animate-slide-up">
            <p className="text-center text-white/50 text-sm mb-4">{L.have_account}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('login')}
                className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}
              >
                {L.yes}
              </button>
              <button
                onClick={() => navigate('register')}
                className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #00C27C, #00E89A)',
                  color: '#0D1B3E',
                  boxShadow: '0 4px 18px rgba(0,194,124,0.4)',
                }}
              >
                {L.no}
              </button>
            </div>
          </div>
        )}

        {/* Manual CTA fallback when no conversation started */}
        {!showLangGrid && !showAccountQ && (
          <div className="w-full px-5 mt-7 flex flex-col gap-3 animate-slide-up">
            <button
              onClick={() => navigate('register')}
              className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 18px rgba(0,194,124,0.4)' }}
            >
              Create Account
            </button>
            <button
              onClick={() => navigate('login')}
              className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)' }}
            >
              I Have an Account
            </button>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
