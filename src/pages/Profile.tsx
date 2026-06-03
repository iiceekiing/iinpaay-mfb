import { useStore } from '../store';
import { useLang } from '../store';
import { BottomNav } from '../components/ui/BottomNav';
import { VoiceToggle } from '../components/ui/VoiceToggle';
import { LANG_OPTIONS } from '../constants/langs';
import { formatDate, formatNaira } from '../utils';
import type { LangCode } from '../types';

export function Profile() {
  const user        = useStore(s => s.currentUser);
  const logout      = useStore(s => s.logout);
  const language    = useStore(s => s.language);
  const setLanguage = useStore(s => s.setLanguage);
  const L           = useLang();

  if (!user) return null;

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #7C4DFF)' }}>
        <div className="px-5 pt-12 pb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black mb-3"
               style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E' }}>
            {user.fullName[0]}
          </div>
          <h1 className="text-white font-bold text-lg">{user.fullName}</h1>
          <p className="text-white/60 text-sm">{user.phone}</p>
        </div>
      </div>

      <div className="scroll-area">
        {/* Account info */}
        <div className="mx-4 mt-4 bg-white rounded-2xl card overflow-hidden mb-4">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider px-4 pt-4 pb-2">Account Details</p>
          {[
            { label: 'Full Name', value: user.fullName },
            { label: 'Account Number', value: user.accountNumber },
            { label: 'Phone', value: user.phone },
            { label: 'Date of Birth', value: formatDate(user.dateOfBirth) },
            { label: 'Gender', value: user.gender === 'male' ? L.male : L.female },
            { label: 'Balance', value: formatNaira(user.balance) },
            { label: 'Member Since', value: formatDate(user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3 border-b last:border-0" style={{ borderColor: '#E4E9F2' }}>
              <span className="text-sm text-ink-muted">{label}</span>
              <span className="text-sm font-semibold text-ink-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* Language select */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Amira's Language</p>
          <div className="grid grid-cols-2 gap-2">
            {LANG_OPTIONS.map(opt => (
              <button key={opt.code} onClick={() => setLanguage(opt.code as LangCode)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all"
                      style={{
                        borderColor: language === opt.code ? '#00C27C' : '#CBD3E8',
                        background: language === opt.code ? '#D6F5EA' : '#fff',
                      }}>
                <span>{opt.flag}</span>
                <span className="text-sm font-semibold"
                      style={{ color: language === opt.code ? '#009962' : '#0D1B3E' }}>
                  {opt.label}
                </span>
                {language === opt.code && <span className="ml-auto text-brand-accent text-sm">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Voice toggle */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Voice Assistance</p>
          <VoiceToggle />
        </div>

        {/* Sign out */}
        <div className="mx-4 mb-4">
          <button onClick={logout}
                  className="w-full py-4 rounded-2xl font-bold text-base border-2 transition-all active:scale-95"
                  style={{ borderColor: '#FF4757', color: '#FF4757', background: 'rgba(255,71,87,0.04)' }}>
            Sign Out
          </button>
        </div>

        {/* Demo note */}
        <div className="mx-4 mb-6 p-3 rounded-xl"
             style={{ background: 'rgba(26,60,143,0.05)', border: '1px solid rgba(26,60,143,0.1)' }}>
          <p className="text-xs text-ink-muted text-center">
            This is an iinpaay Amira voice-assistant demo. All data is stored locally on your device.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
