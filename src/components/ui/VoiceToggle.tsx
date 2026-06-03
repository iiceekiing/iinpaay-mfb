import { useStore } from '../../store';

interface VoiceToggleProps {
  compact?: boolean;
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="relative flex-shrink-0 rounded-full transition-all duration-300"
      style={{
        width:      52,
        height:     28,
        background: on ? '#00C27C' : '#CBD3E8',
        boxShadow:  on ? '0 0 12px rgba(0,194,124,0.4)' : 'none',
      }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white shadow-sm transition-all duration-300"
        style={{ width: 22, height: 22, left: on ? 27 : 3 }}
      />
    </button>
  );
}

export function VoiceToggle({ compact = false }: VoiceToggleProps) {
  const voiceEnabled      = useStore(s => s.voiceEnabled);
  const voiceGuideEnabled = useStore(s => s.voiceGuideEnabled);
  const toggleVoice       = useStore(s => s.toggleVoice);
  const toggleVoiceGuide  = useStore(s => s.toggleVoiceGuide);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={toggleVoice}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: voiceEnabled ? 'rgba(0,194,124,0.12)' : 'rgba(122,139,168,0.12)',
            border:     voiceEnabled ? '1px solid rgba(0,194,124,0.3)' : '1px solid rgba(122,139,168,0.3)',
            color:      voiceEnabled ? '#00C27C' : '#7A8BA8',
          }}
          title={voiceEnabled ? 'Amira voice is ON' : 'Amira voice is OFF'}
        >
          {voiceEnabled ? '🔊' : '🔇'} Amira
        </button>

        <button
          onClick={toggleVoiceGuide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: voiceGuideEnabled ? 'rgba(26,60,143,0.12)' : 'rgba(122,139,168,0.12)',
            border:     voiceGuideEnabled ? '1px solid rgba(26,60,143,0.3)' : '1px solid rgba(122,139,168,0.3)',
            color:      voiceGuideEnabled ? '#1A3C8F' : '#7A8BA8',
          }}
          title={voiceGuideEnabled ? 'Voice Guide is ON' : 'Voice Guide is OFF'}
        >
          {voiceGuideEnabled ? '📢' : '📵'} Guide
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Amira voice toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: voiceEnabled ? '#D6F5EA' : '#F4F6FB' }}>
            {voiceEnabled ? '🔊' : '🔇'}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-primary">Amira Voice</p>
            <p className="text-xs text-ink-muted">
              {voiceEnabled ? 'Amira speaks when activated' : 'Amira is muted — text only'}
            </p>
          </div>
        </div>
        <ToggleSwitch on={voiceEnabled} onToggle={toggleVoice} />
      </div>

      {/* Voice Guide toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: voiceGuideEnabled ? '#E8EEFB' : '#F4F6FB' }}>
            {voiceGuideEnabled ? '📢' : '📵'}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-primary">Voice Guide</p>
            <p className="text-xs text-ink-muted">
              {voiceGuideEnabled
                ? 'Narrates fields and screens automatically'
                : 'Screen narration is off'}
            </p>
          </div>
        </div>
        <ToggleSwitch on={voiceGuideEnabled} onToggle={toggleVoiceGuide} />
      </div>
    </div>
  );
}
