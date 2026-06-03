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
  const isListening  = useStore(s => s.isListening);
  const isSpeaking   = useStore(s => s.isSpeaking);
  const isProcessing = useStore(s => s.isProcessing);
  const voiceEnabled = useStore(s => s.voiceEnabled);

  const DIM  = { sm: 44, md: 56, lg: 68 };
  const ICON = { sm: 16, md: 20, lg: 24 };
  const dim  = DIM[size];
  const icon = ICON[size];

  const noSpeech = !isSpeechSupported();
  const active   = isListening || isSpeaking || isProcessing;

  // Color theming per state
  const bg = isProcessing
    ? 'linear-gradient(135deg, #F5A623, #FFD166)'     // gold = processing
    : isListening
    ? 'linear-gradient(135deg, #1A3C8F, #3B9EFF)'     // blue = listening
    : isSpeaking
    ? 'linear-gradient(135deg, #009962, #00C27C)'     // green = speaking
    : voiceEnabled
    ? 'linear-gradient(135deg, #00C27C, #00E89A)'     // green idle
    : 'linear-gradient(135deg, #7A8BA8, #9BAABF)';    // grey = voice off

  const glowColor = isProcessing  ? 'rgba(245,166,35,0.45)'
                  : isListening   ? 'rgba(59,158,255,0.5)'
                  : isSpeaking    ? 'rgba(0,194,124,0.5)'
                  : 'rgba(0,194,124,0.3)';

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-1.5 ${className}`}
      style={{ width: dim + 48, height: dim + 48 }}
    >
      {/* Glow rings — idle */}
      {!active && voiceEnabled && !noSpeech && (
        <>
          <span className="absolute rounded-full pointer-events-none"
                style={{ width: dim + 16, height: dim + 16, border: '1.5px solid rgba(0,194,124,0.22)', animation: 'glowRing 2.8s ease-in-out infinite' }} />
          <span className="absolute rounded-full pointer-events-none"
                style={{ width: dim + 32, height: dim + 32, border: '1px solid rgba(0,194,124,0.1)', animation: 'glowRing 2.8s ease-in-out 0.7s infinite' }} />
        </>
      )}

      {/* Active rings */}
      {active && (
        <>
          <span className="absolute rounded-full pointer-events-none"
                style={{ width: dim + 18, height: dim + 18, border: `2px solid ${glowColor}`, animation: 'glowRing 1.2s ease-in-out infinite' }} />
          <span className="absolute rounded-full pointer-events-none"
                style={{ width: dim + 36, height: dim + 36, border: `1.5px solid ${glowColor.replace('0.5','0.2').replace('0.45','0.18')}`, animation: 'glowRing 1.2s ease-in-out 0.3s infinite' }} />
        </>
      )}

      {/* Core button */}
      <button
        onClick={noSpeech ? undefined : onClick}
        className="relative z-10 rounded-full flex items-center justify-center transition-transform active:scale-90 select-none"
        style={{
          width:  dim,
          height: dim,
          background: bg,
          boxShadow: active
            ? `0 0 28px ${glowColor}, 0 6px 18px rgba(0,0,0,0.18)`
            : `0 0 16px rgba(0,194,124,0.28), 0 4px 12px rgba(0,0,0,0.1)`,
          animation: (!active && voiceEnabled && !noSpeech)
            ? 'pulseMic 2.5s cubic-bezier(0.4,0,0.6,1) infinite'
            : undefined,
          cursor: noSpeech ? 'default' : 'pointer',
        }}
        title={
          isProcessing ? 'Processing…'
          : isListening ? 'Listening — speak now'
          : isSpeaking  ? 'Amira is speaking'
          : !voiceEnabled ? 'Voice is off — enable in Profile'
          : noSpeech   ? 'Voice not supported in this browser'
          : 'Tap to speak'
        }
        aria-label={isListening ? 'Listening' : isProcessing ? 'Processing' : 'Activate voice'}
      >
        {isProcessing ? (
          /* Spinning dots when processing */
          <div className="flex gap-[3px]">
            {[0,1,2].map(i => (
              <div key={i} className="w-[5px] h-[5px] rounded-full bg-white/90"
                   style={{ animation: `bounceDot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
            ))}
          </div>
        ) : isListening ? (
          /* Bars when listening */
          <div className="flex items-center gap-[2.5px]">
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 3, height: icon * 0.55, borderRadius: 2, background: '#fff',
                animation: `wave 0.9s ease-in-out ${(i-1)*0.1}s infinite`,
                transformOrigin: 'bottom',
              }} />
            ))}
          </div>
        ) : isSpeaking ? (
          /* Sound wave when speaking */
          <div className="flex items-center gap-[3px]">
            {[1,2,3].map(i => (
              <div key={i} style={{
                width: 3, height: icon * 0.48, borderRadius: 2, background: 'rgba(255,255,255,0.85)',
                animation: `wave 0.9s ease-in-out ${(i-1)*0.2}s infinite`,
                transformOrigin: 'center',
              }} />
            ))}
          </div>
        ) : (
          /* Mic icon */
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="8"  y1="22" x2="16" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Dismiss ✕ */}
      {onDismiss && !isListening && !isProcessing && (
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="absolute z-20 flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 17, height: 17, top: 2, right: 2,
            background: 'rgba(13,27,62,0.7)', border: '1px solid rgba(255,255,255,0.18)',
            fontSize: 8, color: 'rgba(255,255,255,0.75)', lineHeight: 1,
          }}
          title="Dismiss" aria-label="Dismiss Amira"
        >
          ✕
        </button>
      )}

      {/* State label */}
      {label && (
        <span className="text-[10px] font-semibold tracking-wide select-none"
              style={{ color: isProcessing ? '#F5A623' : isListening ? '#3B9EFF' : 'rgba(255,255,255,0.5)' }}>
          {isProcessing ? 'Processing…' : isListening ? 'Listening…' : label}
        </span>
      )}

      {/* No-speech hint */}
      {noSpeech && (
        <span className="text-[9px] text-white/30 text-center max-w-[72px] leading-tight select-none -mt-1">
          Use Chrome
        </span>
      )}
    </div>
  );
}

/** Small "Ask Amira" pill shown when dismissed */
export function AmiraReopenButton({ onReopen }: { onReopen: () => void }) {
  const voiceEnabled = useStore(s => s.voiceEnabled);
  return (
    <button
      onClick={onReopen}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
      style={{ background: 'rgba(0,194,124,0.12)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C' }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
        <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {voiceEnabled ? 'Ask Amira' : 'Amira (muted)'}
    </button>
  );
}
