'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const languages = [
  { id: 'python', name: 'Python', icon: '🐍', color: 'hover:border-[#3776AB]/30 hover:bg-[#3776AB]/5 text-[#3776AB]' },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: 'hover:border-[#F7DF1E]/30 hover:bg-[#F7DF1E]/5 text-[#F7DF1E]' },
  { id: 'cpp', name: 'C++', icon: '⚙️', color: 'hover:border-[#00599C]/30 hover:bg-[#00599C]/5 text-[#00599C]' },
  { id: 'java', name: 'Java', icon: '☕', color: 'hover:border-[#E76F00]/30 hover:bg-[#E76F00]/5 text-[#E76F00]' },
  { id: 'typescript', name: 'TypeScript', icon: '💎', color: 'hover:border-[#3178C6]/30 hover:bg-[#3178C6]/5 text-[#3178C6]' },
  { id: 'go', name: 'Go', icon: '🔵', color: 'hover:border-[#00ADD8]/30 hover:bg-[#00ADD8]/5 text-[#00ADD8]' },
];

export default function NewRoomPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('python');
  const [isInterview, setIsInterview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const room = await api.createRoom(name, language, description, isInterview);
      router.push(`/dashboard/rooms/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 relative min-h-[calc(100vh-4rem)] overflow-hidden bg-bg-primary">
      {/* Background Radial Glow Halos */}
      <div className="floating-orb w-[500px] h-[500px] bg-accent-violet/10 top-0 left-0 -translate-x-1/3 -translate-y-1/3 blur-[120px]" />
      <div className="floating-orb w-[500px] h-[500px] bg-accent-cyan/5 bottom-0 right-0 translate-x-1/4 translate-y-1/4 blur-[120px]" style={{ animationDelay: '-6s' }} />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Content Box */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong rounded-2xl border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-2xl"
        >
          {/* Subtle Accent Glow Inner Panel */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                <Code2 className="w-5.5 h-5.5" />
              </span>
              <span>Create a New Room</span>
            </h1>
            <p className="text-xs text-text-secondary mt-2 font-medium">
              Configure your real-time collaborative sandbox with full syntax support and optional interviewer controls
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Room Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field bg-black/40 border border-white/5 focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/30 text-white rounded-xl placeholder:text-text-muted transition-all"
                placeholder="e.g., Frontend System Interview"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field bg-black/40 border border-white/5 focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/30 text-white rounded-xl placeholder:text-text-muted resize-none h-20 transition-all text-sm py-2.5"
                placeholder="e.g., Session to alignment coding structures and algorithmic logic"
              />
            </div>

            {/* Language Selection Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">Target Language</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {languages.map((lang) => {
                  const isSelected = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id)}
                      className={`relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'border-accent-violet bg-accent-violet/15 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                          : `border-white/5 bg-white/[0.01] text-text-secondary ${lang.color}`
                      }`}
                    >
                      <span className="text-sm shrink-0">{lang.icon}</span>
                      <span>{lang.name}</span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switch Toggle */}
            <div className="pt-4 border-t border-white/[0.04]">
              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Interview Mode</span>
                    <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-accent-cyan/10 text-accent-cyan px-1.5 py-0.5 rounded">Pro</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    Unlocks side-by-side timers, dedicated problem layout blocks, candidate performance reviews, and administrative participant controls.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsInterview(!isInterview)}
                  className={`w-11 h-6.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${
                    isInterview 
                      ? 'bg-gradient-to-r from-accent-violet to-accent-cyan shadow-[0_0_8px_rgba(139,92,246,0.3)]' 
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4.5 h-4.5 rounded-full bg-white absolute top-1"
                    style={{ left: isInterview ? '1.35rem' : '0.25rem' }}
                  />
                </button>
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-accent-violet/20 hover:scale-101 active:scale-99 transition-all cursor-pointer relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Configuring workspace...</span>
                </>
              ) : (
                <>
                  <Code2 className="w-4.5 h-4.5 text-white" />
                  <span>Create Workspace Room</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
