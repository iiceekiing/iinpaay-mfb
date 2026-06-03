import { useStore } from '../../store';

interface AmiraBubbleProps {
  text?:    string;
  compact?: boolean;
}

const LISTENING_LABELS: Record<string, string> = {
  en: 'Listening…', ha: 'Ina sauraro…', yo: 'Ń gbọ́…', ig: 'Na-anụ olu…',
};
const SPEAKING_LABELS: Record<string, string> = {
  en: 'Amira is speaking…', ha: 'Amira tana magana…', yo: 'Amira ń sọ̀rọ̀…', ig: 'Amira na-asụ okwu…',
};

export function AmiraBubble({ text, compact = false }: AmiraBubbleProps) {
  const storeText   = useStore(s => s.amiraText);
  const isListening = useStore(s => s.isListening);
  const isSpeaking  = useStore(s => s.isSpeaking);
  const lang        = useStore(s => s.language);

  const displayText = text || storeText;
  const hasContent  = displayText || isListening || isSpeaking;
  if (!hasContent) return null;

  return (
    <div className={`animate-fade-in ${compact ? '' : 'mx-4'}`}>
      {/* Identity row */}
      <div className="flex items-center gap-2 mb-1.5 px-1">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A3C8F, #00C27C)' }}
        >
          A
        </div>
        <span className="text-[11px] font-bold" style={{ color: '#1A3C8F' }}>Amira</span>

        {/* Speaking waveform indicator */}
        {isSpeaking && (
          <div className="flex gap-[2.5px] items-center ml-1">
            {[10, 16, 12, 18, 10].map((h, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 2.5,
                  height: h,
                  background: '#00C27C',
                  animation: `wave 1s ease-in-out ${i * 0.12}s infinite`,
                  transformOrigin: 'center',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bubble body */}
      <div
        className="relative rounded-2xl rounded-tl-sm px-4 py-3"
        style={{
          background:  'linear-gradient(135deg, #0D1B3E 0%, #1A3C8F 100%)',
          boxShadow:   '0 4px 20px rgba(26,60,143,0.22)',
        }}
      >
        {isListening ? (
          /* Listening state — animated bars + label */
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-[3px]">
              {[14, 22, 16, 26, 18, 22, 14].map((h, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 3,
                    height: h,
                    background: '#00C27C',
                    animation: `wave 0.85s ease-in-out ${i * 0.1}s infinite`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {LISTENING_LABELS[lang] ?? 'Listening…'}
            </span>
          </div>
        ) : isSpeaking && !displayText ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {SPEAKING_LABELS[lang] ?? 'Speaking…'}
          </p>
        ) : displayText ? (
          <p className="text-[13px] leading-relaxed text-white">{displayText}</p>
        ) : null}

        {/* Tail triangle */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: -6,
            width: 0, height: 0,
            borderTop:   '8px solid #0D1B3E',
            borderLeft:  '6px solid transparent',
            borderRight: '6px solid transparent',
          }}
        />
      </div>
    </div>
  );
}
