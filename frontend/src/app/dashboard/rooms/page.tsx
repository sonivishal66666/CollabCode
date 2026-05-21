'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Code2, Users, Clock, Trash2, Copy, Check, FolderCode, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export default function RoomsListPage() {
  const [rooms, setRooms] = useState<Array<{ id: string; name: string; room_code: string; language: string; is_interview: boolean; participant_count: number; role: string; created_at: string; updated_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api.listRooms()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.deleteRoom(id);
      setRooms(rooms.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 relative min-h-[calc(100vh-4rem)] overflow-hidden bg-bg-primary">
      {/* Background Radial Glow Halos */}
      <div className="floating-orb w-[500px] h-[500px] bg-accent-violet/10 top-0 left-0 -translate-x-1/3 -translate-y-1/3 blur-[120px]" />
      <div className="floating-orb w-[500px] h-[500px] bg-accent-cyan/5 bottom-0 right-0 translate-x-1/4 translate-y-1/4 blur-[120px]" style={{ animationDelay: '-6s' }} />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border-default/50 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-3 transition-colors">
              <Link href="/dashboard" className="flex items-center gap-1.5 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl flex items-center gap-3">
              <FolderCode className="w-8 h-8 text-accent-violet" />
              <span>My Rooms</span>
              <span className="text-xs font-mono font-bold bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg text-text-secondary">
                {rooms.length} Total
              </span>
            </h1>
            <p className="text-text-secondary text-sm mt-1.5 font-medium">
              Manage and enter your live collaborative coding sandboxes
            </p>
          </div>
          <Link 
            href="/dashboard/rooms/new" 
            className="btn-primary text-sm flex items-center gap-2 shadow-lg shadow-accent-violet/20 hover:scale-102 active:scale-98 transition-all"
          >
            <Plus className="w-4.5 h-4.5" /> 
            <span>Create New Room</span>
          </Link>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass-panel-strong rounded-2xl p-20 text-center border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-transparent pointer-events-none" />
            <Code2 className="w-14 h-14 text-text-muted/40 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">No active rooms</h3>
            <p className="text-text-secondary text-xs mb-6 max-w-sm mx-auto leading-relaxed">
              Create a collaborative workspace room to practice, run live code, and interview other engineers in real-time.
            </p>
            <Link href="/dashboard/rooms/new" className="btn-primary text-xs inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room, i) => {
              // Determine language gradient color for left edge border
              const langColor = room.language.toLowerCase() === 'javascript' ? 'from-[#F7DF1E] to-[#F7DF1E]/40' :
                                room.language.toLowerCase() === 'python' ? 'from-[#3776AB] to-[#3776AB]/40' :
                                room.language.toLowerCase() === 'java' ? 'from-[#E76F00] to-[#E76F00]/40' :
                                room.language.toLowerCase() === 'typescript' ? 'from-[#3178C6] to-[#3178C6]/40' :
                                room.language.toLowerCase() === 'go' ? 'from-[#00ADD8] to-[#00ADD8]/40' :
                                room.language.toLowerCase() === 'c++' ? 'from-[#00599C] to-[#00599C]/40' : 
                                'from-accent-violet to-accent-cyan/40';

              const langText = room.language.toLowerCase() === 'javascript' ? 'text-[#F7DF1E]' :
                               room.language.toLowerCase() === 'python' ? 'text-[#3776AB]' :
                               room.language.toLowerCase() === 'java' ? 'text-[#E76F00]' :
                               room.language.toLowerCase() === 'typescript' ? 'text-[#3178C6]' :
                               room.language.toLowerCase() === 'go' ? 'text-[#00ADD8]' :
                               room.language.toLowerCase() === 'c++' ? 'text-[#00599C]' : 'text-accent-violet';

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 glass-panel p-5 card-hover-glow transition-all duration-300"
                >
                  {/* Glowing language accent stripe top boundary */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${langColor} opacity-80 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Link href={`/dashboard/rooms/${room.id}`} className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-bold text-white group-hover:text-accent-cyan transition-colors truncate">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {room.is_interview && (
                            <span className="text-[9px] uppercase tracking-widest font-extrabold bg-accent-emerald/10 text-accent-emerald px-2 py-0.5 rounded-md border border-accent-emerald/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                              Interview
                            </span>
                          )}
                          <span className="text-[9px] uppercase tracking-widest font-extrabold bg-accent-violet/10 text-accent-violet px-2 py-0.5 rounded-md border border-accent-violet/20">
                            {room.role}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.04] px-2.5 py-0.5 rounded-lg">
                          <Code2 className={`w-3.5 h-3.5 ${langText}`} />
                          <span className="font-semibold text-text-primary">{room.language}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-text-muted" />
                          <span>{room.participant_count} active</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <span>Updated {new Date(room.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => copyCode(room.room_code, room.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold text-text-secondary hover:text-white bg-black/40 border border-white/5 hover:border-white/10 active:scale-95 transition-all"
                        title="Copy session code"
                      >
                        {copiedId === room.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-accent-emerald" />
                            <span className="text-accent-emerald">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>#{room.room_code}</span>
                          </>
                        )}
                      </button>
                      
                      <Link 
                        href={`/dashboard/rooms/${room.id}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-white hover:bg-accent-violet/15 hover:border-accent-violet/25 active:scale-95 transition-all flex items-center gap-1 group/enter"
                      >
                        <span>Enter</span>
                        <Plus className="w-3 h-3 rotate-45 group-hover/enter:translate-x-0.5 transition-transform" />
                      </Link>

                      {room.role === 'owner' && (
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="p-2 rounded-xl border border-transparent text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 hover:border-accent-rose/25 active:scale-95 transition-all"
                          title="Delete room"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
