import { useStore } from '../../store';

interface MicButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MicButton({ onClick, size = 'lg', className = '' }: MicButtonProps) {
  const isListening = useStore(s => s.isListening);
  const isSpeaking  = useStore(s => s.isSpeaking);

  const sizes = {
    sm: { btn: 48, icon: 20 },
    md: { btn: 64, icon: 26 },
    lg: { btn: 80, icon: 32 },
  };
  const { btn, icon } = sizes[size];

  const active = isListening || isSpeaking;

  return (
    <div className={`relative flex items-center justify-center ${className}`}
         style={{ width: btn + 80, height: btn + 80 }}>
      {/* Glow rings */}
      {active && (
        <>
          <span className="mic-ring mic-ring-1" />
          <span className="mic-ring mic-ring-2" />
          <span className="mic-ring mic-ring-3" />
        </>
      )}
      {!active && (
        <>
          <span className="absolute rounded-full border-2 border-brand-accent/30"
                style={{ width: btn + 20, height: btn + 20, animation: 'glowRing 2.5s ease-in-out infinite' }} />
          <span className="absolute rounded-full border-2 border-brand-accent/15"
                style={{ width: btn + 44, height: btn + 44, animation: 'glowRing 2.5s ease-in-out 0.5s infinite' }} />
        </>
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        className="relative z-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{
          width: btn,
          height: btn,
          background: active
            ? 'linear-gradient(135deg, #009962, #00C27C)'
            : 'linear-gradient(135deg, #00C27C, #00E89A)',
          boxShadow: active
            ? '0 0 32px rgba(0,194,124,0.6), 0 8px 24px rgba(0,0,0,0.2)'
            : '0 0 24px rgba(0,194,124,0.4), 0 4px 16px rgba(0,0,0,0.15)',
          animation: active ? undefined : 'pulseMic 2s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
        aria-label={isListening ? 'Listening…' : 'Tap to speak'}
      >
        {isListening ? (
          /* Wave bars when listening */
          <div className="flex items-center gap-[3px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  height: icon * 0.5,
                  background: '#fff',
                  animation: `wave 1.2s ease-in-out ${(i - 1) * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        ) : (
          /* Microphone SVG */
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
