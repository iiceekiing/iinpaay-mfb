import { useStore } from '../../store';
import type { Page } from '../../types';

const TABS: { page: Page; label: string; icon: string }[] = [
  { page: 'dashboard', label: 'Home',     icon: '🏠' },
  { page: 'history',   label: 'History',  icon: '📋' },
  { page: 'projects',  label: 'Projects', icon: '💼' },
  { page: 'profile',   label: 'Profile',  icon: '👤' },
];

export function BottomNav() {
  const currentPage = useStore(s => s.page);
  const navigate    = useStore(s => s.navigate);

  return (
    <div className="flex-shrink-0 safe-bottom"
         style={{ background: '#fff', borderTop: '1px solid #E4E9F2', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
      <div className="flex">
        {TABS.map(tab => {
          const active = currentPage === tab.page;
          return (
            <button
              key={tab.page}
              onClick={() => navigate(tab.page)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-semibold"
                    style={{ color: active ? '#00C27C' : '#7A8BA8' }}>
                {tab.label}
              </span>
              {active && (
                <div className="w-4 h-[2px] rounded-full" style={{ background: '#00C27C' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
