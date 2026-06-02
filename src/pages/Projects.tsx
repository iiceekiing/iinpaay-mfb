import { useState } from 'react';
import { useStore, useLang } from '../store';
import { useAmira } from '../hooks/useAmira';
import { BottomNav } from '../components/ui/BottomNav';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { MicButton } from '../components/amira/MicButton';
import { formatNaira, formatDate } from '../utils';
import type { Project } from '../types';

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-2xl p-4 card mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: project.status === 'active' ? '#D6F5EA' : '#E4E9F2' }}>
            <span>{project.status === 'active' ? '💼' : '✓'}</span>
          </div>
          <div>
            <p className="font-bold text-ink-primary text-sm">{project.title}</p>
            <p className="text-xs text-ink-muted">Due: {formatDate(project.deadline)}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{
                background: project.status === 'active' ? '#D6F5EA' : '#E4E9F2',
                color: project.status === 'active' ? '#009962' : '#7A8BA8',
              }}>
          {project.status === 'active' ? 'Active' : 'Done'}
        </span>
      </div>
      {project.description && (
        <p className="text-xs text-ink-muted mb-2 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #E4E9F2' }}>
        <span className="text-xs text-ink-muted">Budget:</span>
        <span className="text-sm font-bold text-brand-accent">{formatNaira(project.budget)}</span>
      </div>
    </div>
  );
}

type FormStep = 'list' | 'create';

export function Projects() {
  const projects       = useStore(s => s.projects);
  const createProject  = useStore(s => s.createProject);
  const L              = useLang();
  const { speak }      = useAmira();
  const [view, setView] = useState<FormStep>('list');

  // Form state
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [budget, setBudget]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const startCreate = () => {
    setView('create');
    speak(L.proj_title_prompt);
    setDone(false);
    setTitle(''); setDesc(''); setBudget(''); setDeadline('');
  };

  const handleCreate = () => {
    setError('');
    if (!title.trim())  { setError('Please enter a project title'); return; }
    const b = parseFloat(budget.replace(/,/g,''));
    if (!b || b <= 0) { setError('Please enter a valid budget'); return; }
    if (!deadline)    { setError('Please select a deadline'); return; }

    createProject({ title, description: desc, budget: b, deadline });
    setDone(true);
    speak(L.proj_success);
    setTimeout(() => setView('list'), 1800);
  };

  return (
    <div className="phone-frame bg-surface-light">
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1B3E, #1A3C8F)' }}>
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          {view === 'create' && (
            <button onClick={() => setView('list')} className="text-white/70 text-sm p-1 -ml-1">← Back</button>
          )}
          <h1 className="text-white font-bold text-xl flex-1">
            {view === 'list' ? 'Projects' : 'New Project'}
          </h1>
          {view === 'list' && <MicButton onClick={startCreate} size="sm" />}
        </div>
      </div>

      <div className="scroll-area">
        {view === 'list' && (
          <div className="px-4 pt-4">
            <AmiraBubble />
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">💼</span>
                <p className="text-sm text-ink-muted mb-4">No projects yet.</p>
                <button onClick={startCreate}
                        className="px-6 py-3 rounded-2xl font-bold text-sm text-ink-primary"
                        style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
                  + Create Your First Project
                </button>
              </div>
            ) : (
              <>
                <button onClick={startCreate}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-ink-primary mb-4 transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)' }}>
                  + New Project
                </button>
                {projects.slice().reverse().map(p => <ProjectCard key={p.id} project={p} />)}
              </>
            )}
          </div>
        )}

        {view === 'create' && !done && (
          <div className="px-4 pt-4 animate-slide-up">
            <AmiraBubble />
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-2">{L.proj_title} *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                       onFocus={() => speak(L.proj_title_prompt)}
                       placeholder="e.g. Logo Design for Startup"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: title ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-2">{L.proj_desc}</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                          placeholder="Describe the project scope…" rows={3}
                          className="w-full px-4 py-3 rounded-2xl text-sm border-2 resize-none transition-all"
                          style={{ borderColor: '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-2">{L.proj_budget} (₦) *</label>
                <input value={budget} onChange={e => setBudget(e.target.value.replace(/[^0-9.]/g,''))}
                       type="number" placeholder="e.g. 50000"
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: budget ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-secondary mb-2">{L.proj_deadline} *</label>
                <input value={deadline} onChange={e => setDeadline(e.target.value)}
                       type="date" min={new Date().toISOString().split('T')[0]}
                       className="w-full px-4 py-4 rounded-2xl text-base border-2 transition-all"
                       style={{ borderColor: deadline ? '#00C27C' : '#CBD3E8', background: '#fff', color: '#0D1B3E' }} />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <button onClick={handleCreate}
                      className="w-full py-4 rounded-2xl font-bold text-base text-ink-primary transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', boxShadow: '0 4px 20px rgba(0,194,124,0.35)' }}>
                Create Project →
              </button>
            </div>
          </div>
        )}

        {done && (
          <div className="text-center pt-16 animate-slide-up">
            <span className="text-6xl mb-4 block">🎉</span>
            <h2 className="text-xl font-black text-ink-primary mb-2">Project Created!</h2>
            <p className="text-sm text-ink-muted">{L.proj_success}</p>
          </div>
        )}

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}
