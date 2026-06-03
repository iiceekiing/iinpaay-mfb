import { useStore } from '../../store';
import { isSpeechSupported } from '../../hooks/useAmira';

interface MicButtonProps {
  onClick:    () => void;
  onDismiss?: () => void;
  size?:      'sm' | 'md' | 'lg';
  label?:     string;
  className?: string;
}

export function MicButton({
  onClick,
  onDismiss,
  size = 'md',
  label,
  className = '',
}: MicButtonProps) {
  const isListening = useStore(s => s.isListening);
  const isSpeaking  = useStore(s => s.isSpeaking);

  const DIM = { sm: 44, md: 56, lg: 68 };
  const ICON = { sm: 16, md: 20, lg: 24 };
  const dim  = DIM[size];
  const icon = ICON[size];

  const active   = isListening || isSpeaking;
  const noSpeech = !isSpeechSupported();

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-2 ${className}`}
    >
      {/* Outer glow rings — only when idle, subtle */}
      {!active && !noSpeech && (
        <>
          <span
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  dim + 18,
              height: dim + 18,
              border: '1.5px solid rgba(0,194,124,0.25)',
              animation: 'glowRing 2.8s ease-in-out infinite',
            }}
          />
          <span
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  dim + 36,
              height: dim + 36,
              border: '1px solid rgba(0,194,124,0.12)',
              animation: 'glowRing 2.8s ease-in-out 0.6s infinite',
            }}
          />
        </>
      )}

      {/* Active rings — prominent when listening or speaking */}
      {active && (
        <>
          <span
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  dim + 20,
              height: dim + 20,
              border: '2px solid rgba(0,194,124,0.45)',
              animation: 'glowRing 1.4s ease-in-out infinite',
            }}
          />
          <span
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  dim + 40,
              height: dim + 40,
              border: '1.5px solid rgba(0,194,124,0.2)',
              animation: 'glowRing 1.4s ease-in-out 0.35s infinite',
            }}
          />
        </>
      )}

      {/* Core button */}
      <button
        onClick={noSpeech ? undefined : onClick}
        className="relative z-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{
          width:  dim,
          height: dim,
          background: active
            ? 'linear-gradient(135deg, #009962, #00C27C)'
            : noSpeech
            ? 'linear-gradient(135deg, #7A8BA8, #9BAABF)'
            : 'linear-gradient(135deg, #00C27C, #00E89A)',
          boxShadow: active
            ? `0 0 28px rgba(0,194,124,0.55), 0 6px 20px rgba(0,0,0,0.18)`
            : `0 0 18px rgba(0,194,124,0.3), 0 4px 14px rgba(0,0,0,0.12)`,
          animation: active ? undefined : noSpeech ? undefined : 'pulseMic 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
          cursor: noSpeech ? 'default' : 'pointer',
        }}
        title={noSpeech ? 'Voice not supported in this browser' : isListening ? 'Listening…' : isSpeaking ? 'Speaking…' : 'Tap to speak'}
        aria-label={isListening ? 'Listening' : 'Tap to speak'}
      >
        {isListening ? (
          /* Wave bars when listening */
          <div className="flex items-center gap-[2.5px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: icon * 0.55,
                  borderRadius: 2,
                  background: '#fff',
                  animation: `wave 1s ease-in-out ${(i - 1) * 0.12}s infinite`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </div>
        ) : isSpeaking ? (
          /* Sound pulse when speaking */
          <div className="flex items-center gap-[2.5px]">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: icon * 0.45,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.85)',
                  animation: `wave 0.9s ease-in-out ${(i - 1) * 0.2}s infinite`,
                  transformOrigin: 'center',
                }}
              />
            ))}
          </div>
        ) : (
          /* Microphone icon */
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="8"  y1="22" x2="16" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Dismiss X — floating top-right of the button */}
      {onDismiss && (
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="absolute z-20 flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors"
          style={{
            width:   18,
            height:  18,
            top:    -4,
            right:  -4,
            background: 'rgba(13,27,62,0.75)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 9,
            lineHeight: 1,
          }}
          title="Dismiss Amira"
          aria-label="Dismiss voice assistant"
        >
          ✕
        </button>
      )}

      {/* Optional label */}
      {label && (
        <span className="text-[10px] font-semibold text-white/55 tracking-wide select-none">
          {label}
        </span>
      )}

      {/* No-speech browser hint */}
      {noSpeech && (
        <span className="text-[9px] text-white/35 text-center max-w-[80px] leading-tight select-none">
          Use Chrome for voice
        </span>
      )}
    </div>
  );
}

/** Small "reopen Amira" pill shown when dismissed */
export function AmiraReopenButton({ onReopen }: { onReopen: () => void }) {
  return (
    <button
      onClick={onReopen}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
      style={{
        background: 'rgba(0,194,124,0.12)',
        border: '1px solid rgba(0,194,124,0.3)',
        color: '#00C27C',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
        <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      Ask Amira
    </button>
  );
}
