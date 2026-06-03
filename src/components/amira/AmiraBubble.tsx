import { useStore } from '../../store';

interface AmiraBubbleProps {
  text?:    string;
  compact?: boolean;
}

const LISTENING_LABELS:   Record<string, string> = { en: 'Listening…',        ha: 'Ina sauraro…', yo: 'Ń gbọ́…',     ig: 'Na-anụ olu…'      };
const PROCESSING_LABELS:  Record<string, string> = { en: 'Processing…',       ha: 'Ana sarrafa…', yo: 'Ń ṣe…',       ig: 'Na-atụgharị…'     };
const SPEAKING_LABELS:    Record<string, string> = { en: 'Amira is speaking…', ha: 'Amira tana…',  yo: 'Amira ń sọ̀…', ig: 'Amira na-asụ okwu…' };
const HEARD_LABELS:       Record<string, string> = { en: 'I heard:',           ha: 'Na ji saurara:', yo: 'Mo gbọ́:',    ig: 'Nụrụ m:'          };

export function AmiraBubble({ text, compact = false }: AmiraBubbleProps) {
  const storeText    = useStore(s => s.amiraText);
  const transcript   = useStore(s => s.transcript);
  const isListening  = useStore(s => s.isListening);
  const isSpeaking   = useStore(s => s.isSpeaking);
  const isProcessing = useStore(s => s.isProcessing);
  const voiceEnabled = useStore(s => s.voiceEnabled);
  const lang         = useStore(s => s.language);

  const displayText = text || storeText;
  const hasContent  = displayText || isListening || isSpeaking || isProcessing;
  if (!hasContent) return null;

  const bubbleBg = isListening  ? 'linear-gradient(135deg, #1A3C8F, #3B9EFF)'
                 : isProcessing ? 'linear-gradient(135deg, #92600A, #F5A623)'
                 : 'linear-gradient(135deg, #0D1B3E, #1A3C8F)';

  return (
    <div className={`animate-fade-in ${compact ? '' : 'mx-4'}`}>
      {/* Identity row */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, #1A3C8F, #00C27C)' }}>
          A
        </div>
        <span className="text-[11px] font-bold" style={{ color: '#1A3C8F' }}>Amira</span>

        {/* Live speaking animation in identity row */}
        {isSpeaking && !isListening && (
          <div className="flex gap-[2px] items-end ml-0.5">
            {[8, 14, 10, 18, 12, 16, 8].map((h, i) => (
              <div key={i} className="rounded-full"
                   style={{ width: 2.5, height: h, background: '#00C27C', animation: `wave 0.9s ease-in-out ${i*0.1}s infinite`, transformOrigin: 'bottom' }} />
            ))}
          </div>
        )}

        {/* Voice-off badge */}
        {!voiceEnabled && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto"
                style={{ background: 'rgba(122,139,168,0.15)', color: '#7A8BA8' }}>
            muted
          </span>
        )}
      </div>

      {/* Bubble */}
      <div className="relative rounded-2xl rounded-tl-sm px-4 py-3"
           style={{ background: bubbleBg, boxShadow: '0 4px 18px rgba(26,60,143,0.2)' }}>

        {isListening ? (
          <div className="flex items-center gap-3">
            {/* Waveform */}
            <div className="flex items-end gap-[3px]">
              {[10, 20, 14, 26, 18, 22, 14, 20, 10].map((h, i) => (
                <div key={i} className="rounded-full"
                     style={{ width: 3, height: h, background: '#fff', animation: `wave 0.75s ease-in-out ${i*0.08}s infinite`, transformOrigin: 'bottom' }} />
              ))}
            </div>
            <span className="text-[13px] font-medium text-white/85">
              {LISTENING_LABELS[lang] ?? 'Listening…'}
            </span>
          </div>

        ) : isProcessing ? (
          <div className="flex items-center gap-2">
            {/* Spinning dots */}
            <div className="flex gap-[4px]">
              {[0,1,2].map(i => (
                <div key={i} className="w-[6px] h-[6px] rounded-full bg-white/90"
                     style={{ animation: `bounceDot 1.2s ease-in-out ${i*0.18}s infinite` }} />
              ))}
            </div>
            <div>
              <span className="text-[12px] font-semibold text-white/90 block">
                {PROCESSING_LABELS[lang] ?? 'Processing…'}
              </span>
              {transcript && (
                <span className="text-[10px] text-white/60">
                  {HEARD_LABELS[lang] ?? 'I heard:'} "{transcript}"
                </span>
              )}
            </div>
          </div>

        ) : isSpeaking && !displayText ? (
          <p className="text-[13px] text-white/55">{SPEAKING_LABELS[lang] ?? 'Speaking…'}</p>

        ) : displayText ? (
          <p className="text-[13px] leading-relaxed text-white">{displayText}</p>

        ) : null}

        {/* Bubble tail */}
        <div style={{
          position: 'absolute', top: 0, left: -6, width: 0, height: 0,
          borderTop:   '8px solid #0D1B3E',
          borderLeft:  '6px solid transparent',
          borderRight: '6px solid transparent',
        }} />
      </div>
    </div>
  );
}
