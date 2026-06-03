import { useStore } from '../../store';

interface VoiceToggleProps {
  compact?: boolean;
}

export function VoiceToggle({ compact = false }: VoiceToggleProps) {
  const voiceEnabled = useStore(s => s.voiceEnabled);
  const toggleVoice  = useStore(s => s.toggleVoice);

  if (compact) {
    return (
      <button
        onClick={toggleVoice}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
        style={{
          background: voiceEnabled ? 'rgba(0,194,124,0.12)' : 'rgba(122,139,168,0.12)',
          border:     voiceEnabled ? '1px solid rgba(0,194,124,0.3)' : '1px solid rgba(122,139,168,0.3)',
          color:      voiceEnabled ? '#00C27C' : '#7A8BA8',
        }}
        title={voiceEnabled ? 'Voice is ON — click to mute' : 'Voice is OFF — click to enable'}
      >
        {voiceEnabled ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
            <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" opacity="0.4" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
        {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white card">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: voiceEnabled ? '#D6F5EA' : '#F4F6FB' }}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </div>
        <div>
          <p className="text-sm font-bold text-ink-primary">Voice Assistance</p>
          <p className="text-xs text-ink-muted">
            {voiceEnabled
              ? 'Amira will speak when activated'
              : 'Amira is muted — text only'}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={toggleVoice}
        role="switch"
        aria-checked={voiceEnabled}
        className="relative flex-shrink-0 rounded-full transition-all duration-300"
        style={{
          width:      52,
          height:     28,
          background: voiceEnabled ? '#00C27C' : '#CBD3E8',
          boxShadow:  voiceEnabled ? '0 0 12px rgba(0,194,124,0.4)' : 'none',
        }}
      >
        <span
          className="absolute top-[3px] rounded-full bg-white shadow-sm transition-all duration-300"
          style={{
            width:  22,
            height: 22,
            left:   voiceEnabled ? 27 : 3,
          }}
        />
      </button>
    </div>
  );
}
