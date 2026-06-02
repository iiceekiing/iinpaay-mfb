import { useStore } from '../../store';

interface AmiraBubbleProps {
  text?: string;
  compact?: boolean;
}

export function AmiraBubble({ text, compact = false }: AmiraBubbleProps) {
  const storeText   = useStore(s => s.amiraText);
  const isListening = useStore(s => s.isListening);
  const isSpeaking  = useStore(s => s.isSpeaking);
  const lang        = useStore(s => s.language);

  const displayText = text || storeText;
  if (!displayText && !isListening && !isSpeaking) return null;

  const listeningLabels: Record<string, string> = {
    en: 'Listening…', ha: 'Ina sauraro…', yo: 'Ń gbọ́…', ig: 'Na-anụ olu…',
  };
  const speakingLabels: Record<string, string> = {
    en: 'Amira is speaking…', ha: 'Amira tana magana…', yo: 'Amira ń sọ̀rọ̀…', ig: 'Amira na-asụ okwu…',
  };

  return (
    <div className={`animate-fade-in ${compact ? 'mx-0' : 'mx-4'}`}>
      {/* Amira identity chip */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style={{ background: 'linear-gradient(135deg, #1A3C8F, #00C27C)' }}>
          A
        </div>
        <span className="text-xs font-semibold text-brand-primary">Amira</span>
        {isSpeaking && (
          <div className="flex gap-[3px] items-center ml-1">
            {[1,2,3].map(i => (
              <div key={i} className="w-[3px] rounded-full bg-brand-accent"
                   style={{ height: 10, animation: `wave 1.2s ease-in-out ${(i-1)*0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 relative"
           style={{
             background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)',
             boxShadow: '0 4px 20px rgba(26,60,143,0.25)',
           }}>

        {isListening ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-end">
              {[14, 20, 16, 22, 14].map((h, i) => (
                <div key={i} className="w-1 rounded-full bg-brand-accent"
                     style={{ height: h, animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite` }} />
              ))}
            </div>
            <span className="text-white/80 text-sm font-medium">
              {listeningLabels[lang] ?? 'Listening…'}
            </span>
          </div>
        ) : isSpeaking && !displayText ? (
          <p className="text-white/60 text-sm">{speakingLabels[lang] ?? 'Speaking…'}</p>
        ) : (
          <p className="text-white text-sm leading-relaxed">{displayText}</p>
        )}
      </div>
    </div>
  );
}
