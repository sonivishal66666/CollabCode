'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Code2, Users, Clock, ArrowRight, FolderCode, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  }
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Array<{ id: string; name: string; room_code: string; language: string; is_interview: boolean; participant_count: number; updated_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listRooms()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { 
      label: 'Active Rooms', 
      value: rooms.length, 
      icon: FolderCode, 
      color: 'accent-violet',
      glowColor: 'rgba(139, 92, 246, 0.15)',
      borderColor: 'border-accent-violet/20',
      textColor: 'text-accent-violet',
      bgColor: 'bg-accent-violet/10',
      svgPath: 'M0,25 Q15,10 30,20 T60,5 T90,22 T100,10 L100,30 L0,30 Z',
      svgStroke: 'rgba(139, 92, 246, 0.4)'
    },
    { 
      label: 'Collaborators', 
      value: rooms.reduce((sum, r) => sum + r.participant_count, 0), 
      icon: Users, 
      color: 'accent-cyan',
      glowColor: 'rgba(34, 211, 238, 0.15)',
      borderColor: 'border-accent-cyan/20',
      textColor: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
      svgPath: 'M0,20 Q20,28 40,15 T70,25 T100,5 L100,30 L0,30 Z',
      svgStroke: 'rgba(34, 211, 238, 0.4)'
    },
    { 
      label: 'Interview Sessions', 
      value: rooms.filter(r => r.is_interview).length, 
      icon: Zap, 
      color: 'accent-emerald',
      glowColor: 'rgba(52, 211, 153, 0.15)',
      borderColor: 'border-accent-emerald/20',
      textColor: 'text-accent-emerald',
      bgColor: 'bg-accent-emerald/10',
      svgPath: 'M0,28 Q25,10 50,22 T80,8 T100,15 L100,30 L0,30 Z',
      svgStroke: 'rgba(52, 211, 153, 0.4)'
    },
  ];

  return (
    <div className="p-8 relative min-h-[calc(100vh-4rem)] overflow-hidden bg-bg-primary">
      {/* Background Radial Ambient Orbs */}
      <div className="floating-orb w-[500px] h-[500px] bg-accent-violet/10 top-0 left-0 -translate-x-1/3 -translate-y-1/3 blur-[120px]" />
      <div className="floating-orb w-[500px] h-[500px] bg-accent-cyan/5 bottom-0 right-0 translate-x-1/4 translate-y-1/4 blur-[120px]" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border-default/50 pb-6 gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Welcome back, <span className="gradient-text drop-shadow-[0_0_15px_rgba(139,92,246,0.15)]">{user?.display_name || 'himanshu'}</span>
            </h1>
            <p className="text-text-secondary text-sm mt-1.5 font-medium">
              Here&apos;s a summary of collaborative activity in your workspace
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-xl text-xs text-text-secondary font-mono">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span>Workspace Active</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="glass-panel-strong rounded-2xl p-6 card-hover-glow relative overflow-hidden border border-white/5 group"
            >
              {/* Premium Mini-Trendline background indicator */}
              <svg 
                className="absolute bottom-0 right-0 w-36 h-16 opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" 
                viewBox="0 0 100 30" 
                preserveAspectRatio="none"
              >
                <path d={stat.svgPath} fill={stat.glowColor} />
                <path d={stat.svgPath.split(' L')[0]} fill="none" stroke={stat.svgStroke} strokeWidth="1.5" />
              </svg>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{stat.label}</span>
                <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5.5 h-5.5 ${stat.textColor}`} />
                </div>
              </div>
              
              <div className="relative z-10 mt-2">
                <p className="text-4xl font-extrabold tracking-tight text-white">
                  {stat.value}
                </p>
                <p className="text-[10px] text-text-muted mt-1 font-medium font-mono uppercase tracking-wider">
                  Live Synced
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions Center */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/rooms/new" className="h-full block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel-strong rounded-2xl p-6 card-hover-glow cursor-pointer group h-full flex flex-col justify-center relative overflow-hidden border border-white/5 hover:border-accent-violet/30 transition-all duration-300"
            >
              <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-accent-violet/10 via-accent-cyan/5 to-transparent pointer-events-none" />
              {/* Spinning background rings */}
              <div className="absolute -right-10 -top-10 w-40 h-40 border border-white/5 rounded-full group-hover:scale-110 group-hover:border-accent-violet/10 transition-all duration-500 pointer-events-none" />
              <div className="absolute -right-5 -top-5 w-24 h-24 border border-white/5 rounded-full group-hover:scale-125 group-hover:border-accent-cyan/15 transition-all duration-500 pointer-events-none" />

              <div className="flex items-center gap-5 relative z-10">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-2xl blur-md opacity-40 group-hover:opacity-85 transition duration-300" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center shadow-lg">
                    <Plus className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-violet transition-colors">Create New Room</h3>
                  <p className="text-xs text-text-secondary max-w-xs leading-relaxed">Start an instant interactive collaborative development and coding workspace</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ml-auto border border-white/5 group-hover:bg-accent-violet/10 group-hover:border-accent-violet/20 transition-all">
                  <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel-strong rounded-2xl p-6 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-accent-cyan/5 to-transparent pointer-events-none" />
            <JoinRoomInput />
          </motion.div>
        </div>

        {/* Recent Rooms List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between border-b border-border-default/40 pb-4">
            <div className="flex items-center gap-2">
              <FolderCode className="w-5 h-5 text-accent-violet" />
              <h2 className="text-xl font-bold text-white tracking-tight">Recent Rooms</h2>
            </div>
            <Link 
              href="/dashboard/rooms" 
              className="text-xs font-bold text-accent-violet hover:text-accent-cyan transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-violet/5 border border-accent-violet/15 hover:border-accent-cyan/30"
            >
              <span>View all rooms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-44 rounded-2xl" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-panel-strong rounded-2xl p-16 text-center border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-transparent pointer-events-none" />
              <Code2 className="w-14 h-14 text-text-muted/40 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-2">No active workspaces</h3>
              <p className="text-text-secondary text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                You haven&apos;t created or joined any collaborative sessions yet. Spin up a room to start coding.
              </p>
              <Link href="/dashboard/rooms/new" className="btn-primary text-xs inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create a Room</span>
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {rooms.slice(0, 6).map((room) => {
                // Determine a language gradient color for glowing top border
                const langColor = room.language.toLowerCase() === 'javascript' ? 'from-[#F7DF1E] to-[#F7DF1E]/10' :
                                  room.language.toLowerCase() === 'python' ? 'from-[#3776AB] to-[#3776AB]/10' :
                                  room.language.toLowerCase() === 'java' ? 'from-[#E76F00] to-[#E76F00]/10' :
                                  room.language.toLowerCase() === 'typescript' ? 'from-[#3178C6] to-[#3178C6]/10' :
                                  room.language.toLowerCase() === 'go' ? 'from-[#00ADD8] to-[#00ADD8]/10' :
                                  room.language.toLowerCase() === 'c++' ? 'from-[#00599C] to-[#00599C]/10' : 
                                  'from-accent-violet to-accent-cyan/10';

                const langText = room.language.toLowerCase() === 'javascript' ? 'text-[#F7DF1E]' :
                                 room.language.toLowerCase() === 'python' ? 'text-[#3776AB]' :
                                 room.language.toLowerCase() === 'java' ? 'text-[#E76F00]' :
                                 room.language.toLowerCase() === 'typescript' ? 'text-[#3178C6]' :
                                 room.language.toLowerCase() === 'go' ? 'text-[#00ADD8]' :
                                 room.language.toLowerCase() === 'c++' ? 'text-[#00599C]' : 'text-accent-violet';

                return (
                  <motion.div
                    key={room.id}
                    variants={itemVariants}
                    className="h-full"
                  >
                    <Link href={`/dashboard/rooms/${room.id}`} className="block h-full">
                      <div className="glass-panel rounded-2xl p-5 card-hover-glow cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all duration-300">
                        {/* Glowing language accent stripe top boundary */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${langColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        
                        <div>
                          <div className="flex items-start justify-between mb-4 mt-2">
                            <h3 className="font-bold text-white group-hover:text-accent-cyan transition-colors truncate text-[15px] leading-tight flex-1">
                              {room.name}
                            </h3>
                            {room.is_interview && (
                              <span className="text-[9px] uppercase tracking-widest font-extrabold bg-accent-emerald/10 text-accent-emerald px-2 py-1 rounded-md shrink-0 ml-2 border border-accent-emerald/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                                Interview
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                            <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-lg">
                              <Code2 className={`w-3.5 h-3.5 ${langText}`} /> 
                              <span className="font-semibold text-text-primary">{room.language}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-white/[0.01] px-2 py-1 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-text-muted" /> 
                              <span>{room.participant_count} active</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                          <span className="text-[10px] text-text-muted font-mono bg-black/40 border border-white/[0.03] px-2.5 py-1 rounded-lg">
                            #{room.room_code}
                          </span>
                          
                          <span className="text-xs text-accent-violet opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-semibold">
                            <span>Enter Room</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function JoinRoomInput() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const result = await api.joinRoom(code.trim());
      setMsg('Joined successfully!');
      window.location.href = `/dashboard/rooms/${result.room_id}`;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 h-full relative z-10">
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-accent-cyan animate-pulse" />
          <h3 className="font-bold text-white text-base">Join a Room</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">Enter a collaborative session code to connect instantly</p>
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent-cyan transition-colors">
              <span className="font-mono text-xs select-none">#</span>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="input-field text-sm font-mono pl-8 flex-1 bg-black/40 border border-white/5 focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30 text-white rounded-xl placeholder:text-text-muted"
              placeholder="Enter room code"
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn-primary text-sm px-5 rounded-xl shrink-0 flex items-center gap-2 group/btn relative overflow-hidden active:scale-95 transition-transform"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Join</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs mt-2.5 font-semibold ${msg.includes('successfully') ? 'text-accent-emerald' : 'text-accent-rose'}`}
          >
            {msg}
          </motion.p>
        )}
      </div>
    </div>
  );
}
