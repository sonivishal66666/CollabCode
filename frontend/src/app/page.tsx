'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Users, Play, Shield, Zap, ArrowRight, Terminal, Sparkles, 
  Video, PenTool, Command, Layers, CheckCircle, ChevronRight, Star
} from 'lucide-react';

const features = [
  { 
    icon: Code2, 
    title: 'Monaco Professional Editor', 
    desc: 'Deep Monaco integration powered by the same engine behind VS Code. Fully equipped with multi-cursor intelligence, autocomplete, and theme configuration.',
    accent: 'from-accent-violet to-purple-500'
  },
  { 
    icon: Users, 
    title: 'WebRTC Audio & Video Call', 
    desc: 'Connect with teammates natively without third-party services. High-fidelity WebRTC streaming combined with dynamic voice-responsive avatar glows.',
    accent: 'from-accent-cyan to-blue-500'
  },
  { 
    icon: Play, 
    title: 'Secure Sandbox Code Engine', 
    desc: 'Compile and run Python, JavaScript, C++, and Java instantly in sandboxed execution environments, fetching and streaming stdout/stderr with execution timers.',
    accent: 'from-accent-emerald to-green-500'
  },
  { 
    icon: PenTool, 
    title: 'Collaborative Whiteboard', 
    desc: 'Sync vector drawing operations bidirectionally over WebSockets. Features premium design toolkits with pen, eraser, brush modifiers, and geometric canvas shapes.',
    accent: 'from-accent-rose to-red-500'
  },
  { 
    icon: Zap, 
    title: 'OT-Based Conflict Resolution', 
    desc: 'Equipped with Operational Transformation conflict-resolution protocols, ensuring smooth real-time multi-peer synchronizations even on spotty internet connections.',
    accent: 'from-accent-amber to-orange-500'
  },
  { 
    icon: Command, 
    title: 'Universal Command Palette', 
    desc: 'Trigger actions like switching themes, executing code, opening files, or muting sounds at speed with a slide-down blurred command menu (Ctrl+K / Cmd+K).',
    accent: 'from-accent-violet to-accent-cyan'
  },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [liveEditorLines, setLiveEditorLines] = useState<string[]>([
    "def resolve_two_sum(nums, target):",
    "    seen = {}",
    "    for i, num in enumerate(nums):",
    "        complement = target - num",
    "        if complement in seen:",
    "            return [seen[complement], i]",
    "        seen[num] = i"
  ]);
  const [cursorLine, setCursorLine] = useState(7);
  const [typingName, setTypingName] = useState("soni");

  // Simulate typing additions in mockup for extreme visual realism
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEditorLines(prev => {
        if (prev.length >= 10) {
          setCursorLine(7);
          return [
            "def resolve_two_sum(nums, target):",
            "    seen = {}",
            "    for i, num in enumerate(nums):",
            "        complement = target - num",
            "        if complement in seen:",
            "            return [seen[complement], i]",
            "        seen[num] = i"
          ];
        }
        setCursorLine(prev.length + 1);
        setTypingName(prev.length % 2 === 0 ? "soni" : "vishal");
        return [...prev, prev.length === 7 
          ? "        # Complement match found" 
          : prev.length === 8 
          ? "        print(f'Match found at: {seen[complement]}')"
          : "    return None"
        ];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Smooth 3D tilt formula
    setRotateX(-y / (box.height / 2) * 12);
    setRotateY(x / (box.width / 2) * 12);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] selection:bg-accent-violet/30 selection:text-white">
      
      {/* 3D Cyberpunk Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111119_1px,transparent_1px),linear-gradient(to_bottom,#111119_1px,transparent_1px)] bg-[size:4rem_4rem] [perspective:500px] [transform-style:preserve-3d] [transform:rotateX(60deg)_translateY(-150px)] opacity-20 pointer-events-none" />

      {/* Floating Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-accent-violet/20 to-purple-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-accent-cyan/15 to-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent-rose/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Sticky Premium Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.04] bg-[#050508]/70 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center border border-white/10">
              <Code2 className="w-5 h-5 text-accent-cyan" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              CollabCode
              <span className="text-[9px] bg-accent-violet/10 border border-accent-violet/20 text-accent-violet px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Ultra
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-text-secondary hover:text-white transition-all"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="relative group inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold text-white overflow-hidden transition-all duration-300"
          >
            {/* Animated button background border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet bg-[size:200%_auto] animate-gradient-shift" />
            <span className="relative z-10 flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-28">
        
        {/* Floating Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase text-accent-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" /> Next-Gen Realtime Workspace
          </span>
        </motion.div>

        {/* Catchy Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] max-w-4xl text-white select-none"
        >
          Code Together.
          <br />
          <span className="bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-shift">
            Build Natively.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed font-medium"
        >
          A production-grade realtime collaborative IDE workspace equipped with 
          OT conflict resolution, live voice-responsive WebRTC channels, interactive whiteboards, 
          and sandboxed multi-language execution.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-4 relative z-20"
        >
          <Link 
            href="/signup" 
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-cyan hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] text-white text-sm font-bold flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Start Coding Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] text-white text-sm font-bold flex items-center gap-1.5 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Enter Room
          </Link>
        </motion.div>

        {/* 3D Editor Tilt Mockup */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 w-full max-w-5xl relative group cursor-pointer"
        >
          {/* Neon Floor Glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
          
          {/* 3D Card Structure */}
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
              perspective: 1000,
            }}
            animate={{
              rotateX,
              rotateY,
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="relative glass-panel rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0c0c14]/90 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)]"
          >
            {/* Mockup Header tab */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-white/[0.02] select-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-accent-rose/70" />
                  <div className="w-3 h-3 rounded-full bg-accent-amber/70" />
                  <div className="w-3 h-3 rounded-full bg-accent-emerald/70" />
                </div>
                <span className="text-[11px] text-text-muted ml-3 font-mono tracking-tight flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-accent-violet" /> main.py — CollabCode Room
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-accent-cyan/15 text-accent-cyan px-2 py-0.5 rounded font-mono font-bold">
                  2 PEERS ACTIVE
                </span>
              </div>
            </div>

            {/* Code mockup and interactive components */}
            <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[300px]">
              
              {/* Code pane */}
              <div className="lg:col-span-3 p-6 font-mono text-[13px] leading-relaxed text-left border-r border-white/[0.04]">
                {liveEditorLines.map((line, idx) => (
                  <div key={idx} className={`flex items-center ${idx + 1 === cursorLine ? 'bg-white/[0.03]' : ''}`}>
                    <span className="text-text-muted/40 w-8 text-right mr-4 select-none">{idx + 1}</span>
                    <span className="text-text-secondary">
                      {line.startsWith("def") ? (
                        <span><span className="text-accent-violet font-bold">def</span> <span className="text-accent-cyan">{line.substring(4, 20)}</span>{line.substring(20)}</span>
                      ) : line.includes("import") || line.includes("return") || line.includes("for") || line.includes("if") || line.includes("in") ? (
                        <span dangerouslySetInnerHTML={{ __html: line
                          .replace("return", "<span class='text-accent-violet font-bold'>return</span>")
                          .replace("for", "<span class='text-accent-violet font-bold'>for</span>")
                          .replace("in", "<span class='text-accent-violet font-bold'>in</span>")
                          .replace("if", "<span class='text-accent-violet font-bold'>if</span>")
                        }} />
                      ) : (
                        <span>{line}</span>
                      )}
                    </span>
                    {idx + 1 === cursorLine && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan text-[10px] flex items-center gap-1 font-sans select-none animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-ping" />
                        {typingName} typing...
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Collaborative overlays preview inside the 3D card */}
              <div className="p-4 bg-white/[0.01] flex flex-col justify-between gap-4 select-none">
                {/* Voice Calling panel simulation */}
                <div className="border border-white/[0.05] rounded-xl p-3 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Voice & Video</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#08080f] px-2 py-1.5 rounded-lg border border-accent-emerald shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-accent-emerald/20 text-accent-emerald flex items-center justify-center text-[9px] font-extrabold">V</span>
                        <span className="text-[10px] font-semibold text-white">Vishal (You)</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-ping" />
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.02] px-2 py-1.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-[9px] font-extrabold">S</span>
                        <span className="text-[10px] font-semibold text-text-secondary">soni</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Whiteboard stroke preview */}
                <div className="border border-white/[0.05] rounded-xl p-3 bg-white/[0.02] flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-accent-violet" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Whiteboard Sync</span>
                  </div>
                  <div className="relative w-full h-16 border border-white/[0.04] rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
                    {/* Simulated hand drawn path */}
                    <svg className="w-full h-full stroke-accent-cyan stroke-[2] fill-none stroke-linecap-round">
                      <motion.path 
                        d="M 20 40 Q 60 10 100 40 T 180 30" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      />
                    </svg>
                    <span className="absolute bottom-1 right-1 text-[8px] bg-accent-violet/20 text-accent-violet px-1 rounded font-mono">
                      vector data
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Infinite Scrolling Premium Tech logos or stats banner */}
      <section className="relative z-10 border-y border-white/[0.04] bg-white/[0.01] backdrop-blur-sm py-8 overflow-hidden select-none">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-around items-center gap-8">
          <div className="flex items-center gap-2 text-text-secondary opacity-65 hover:opacity-100 transition-opacity">
            <Layers className="w-4 h-4 text-accent-violet" />
            <span className="text-xs font-bold uppercase tracking-wider">Redis PubSub</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary opacity-65 hover:opacity-100 transition-opacity">
            <Zap className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider">WebSocket OT Sync</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary opacity-65 hover:opacity-100 transition-opacity">
            <Shield className="w-4 h-4 text-accent-emerald" />
            <span className="text-xs font-bold uppercase tracking-wider">Sandboxed Execution</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary opacity-65 hover:opacity-100 transition-opacity">
            <Video className="w-4 h-4 text-accent-rose" />
            <span className="text-xs font-bold uppercase tracking-wider">WebRTC Peer Connection</span>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative z-10 px-6 lg:px-12 py-32 bg-[#06060c]">
        
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mb-3"
          >
            <span className="px-3.5 py-1 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20 text-[10px] font-bold uppercase tracking-wider">
              High Performance Specs
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Everything You Need</h2>
          <p className="mt-3 text-text-secondary text-sm md:text-base max-w-lg mx-auto font-medium">
            Architected specifically for software engineering teams that require sub-millisecond collaboration feedback speeds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.1] p-7 transition-all duration-300 group cursor-pointer overflow-hidden"
            >
              {/* Subtle background card gradient shine */}
              <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${f.accent} rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-300`} />
              
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} p-[1px] mb-5 group-hover:scale-105 transition-transform duration-300`}>
                <div className="w-full h-full rounded-xl bg-[#09090f] flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-1.5">
                {f.title}
                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </h3>
              
              <p className="text-text-secondary text-[13px] leading-relaxed font-medium group-hover:text-text-primary transition-colors">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 px-6 py-28 overflow-hidden select-none border-t border-white/[0.04] bg-[#050508]">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/5 via-accent-cyan/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent p-12 text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-violet/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-cyan/20 rounded-full blur-3xl" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="relative z-10 space-y-6"
          >
            <div className="flex justify-center gap-1 text-accent-amber">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-current" />)}
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ready to Code Together?</h2>
            
            <p className="text-text-secondary text-sm md:text-base max-w-lg mx-auto font-semibold leading-relaxed">
              Launch a live joint workspace session instantly. Invite collaborators with zero setup or configuration overhead.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-xl bg-white text-black hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.25)] text-sm font-bold transition-all duration-300"
              >
                Create Free Room
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-white text-sm font-bold transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 lg:px-12 py-10 bg-[#050508]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6.5 h-6.5 rounded-md bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center border border-white/5">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-white">CollabCode</span>
          </div>
          <p className="text-xs text-text-muted font-mono">
            Designed Natively • Next.js & React 19 • Go WebSocket Signaling Engine
          </p>
        </div>
      </footer>

    </div>
  );
}
