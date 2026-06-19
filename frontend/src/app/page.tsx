'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useTransform, useInView, animate } from 'framer-motion';
import { 
  Code2, Users, Play, Shield, Zap, ArrowRight, Terminal, Sparkles, 
  Video, PenTool, Command, Layers, CheckCircle, ChevronRight, Star,
  Share2, MousePointer, ShieldCheck, Heart, GitBranch
} from 'lucide-react';

// Dynamic HTML5 Parallax Particle Canvas Component
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      baseAlpha: number;
    }> = [];

    const numParticles = Math.min(Math.floor((width * height) / 15000), 100);

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        baseAlpha: Math.random() * 0.4 + 0.1,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let active = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      active = true;
    };

    const handleMouseLeave = () => {
      active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    const animateParticles = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse parallax drift
        if (active) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            // Drifts slightly away from mouse
            p.x -= (dx / dist) * force * 1.2;
            p.y -= (dy / dist) * force * 1.2;
            p.alpha = Math.min(p.baseAlpha + force * 0.4, 0.8);
          } else {
            p.alpha = p.baseAlpha;
          }
        } else {
          p.alpha = p.baseAlpha;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`; // Cyan accent color
        ctx.fill();

        // Connect nearby particles
        particles.forEach((other) => {
          if (p === other) return;
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.04 * (1 - dist / 90)})`; // Purple link
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

// Mouse spotlight tracking card component
function SpotlightCard({ 
  children, 
  className = "",
  accent = ""
}: { 
  children: React.ReactNode; 
  className?: string;
  accent?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card relative rounded-2xl border border-white/[0.04] bg-[#0c0c14]/40 hover:bg-[#0c0c14]/80 p-8 transition-all duration-500 group overflow-hidden ${className}`}
    >
      {/* Glow aura */}
      <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${accent} rounded-full blur-[70px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Animated counting number when scrolled into view
function CountingNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;
    const node = ref.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = Math.round(v).toString() + suffix;
      },
    });

    return () => controls.stop();
  }, [value, isInView, suffix]);

  return <span ref={ref} className="font-mono text-4xl md:text-5xl font-black tracking-tight text-white">0{suffix}</span>;
}

// Animated spring word reveal headline component
function WordReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] max-w-4xl text-white select-none text-balance">
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: idx * 0.12,
          }}
          className="inline-block mr-3 md:mr-5 last:mr-0"
        >
          {word === "Build" || word === "Natively." ? (
            <span className="bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-shift">
              {word}
            </span>
          ) : (
            word
          )}
        </motion.span>
      ))}
    </h1>
  );
}

const featuresList = [
  { 
    icon: Code2, 
    title: 'Monaco Editor Intelligence', 
    desc: 'Deep Monaco integration powered by the same engine behind VS Code. Fully equipped with multi-cursor intelligence, live autocomplete, syntax diagnostics, and theme customization.',
    accent: 'from-accent-violet to-purple-500'
  },
  { 
    icon: Users, 
    title: 'WebRTC VoIP Channel', 
    desc: 'Connect with teammates natively without third-party services. High-fidelity WebRTC streaming combined with dynamic voice-responsive avatar glows.',
    accent: 'from-accent-cyan to-blue-500'
  },
  { 
    icon: Play, 
    title: 'Sandboxed Engine', 
    desc: 'Compile and run Python, JavaScript, C++, and Java instantly in sandboxed execution environments, fetching and streaming stdout/stderr with execution timers.',
    accent: 'from-accent-emerald to-green-500'
  },
  { 
    icon: PenTool, 
    title: 'Collaborative Board', 
    desc: 'Sync vector drawing operations bidirectionally over WebSockets. Features premium design toolkits with pen, eraser, brush modifiers, and geometric canvas shapes.',
    accent: 'from-accent-rose to-red-500'
  },
  { 
    icon: Zap, 
    title: 'OT Conflict Resolution', 
    desc: 'Equipped with Operational Transformation conflict-resolution protocols, ensuring smooth real-time multi-peer synchronizations even on spotty internet connections.',
    accent: 'from-accent-amber to-orange-500'
  },
  { 
    icon: Command, 
    title: 'Command Palette', 
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

  // Scroll Progress indicator setup
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
    setRotateX(-y / (box.height / 2) * 10);
    setRotateY(x / (box.width / 2) * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] selection:bg-accent-violet/30 selection:text-white">
      
      {/* Scroll Progress Line */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald origin-[0%] z-50" style={{ scaleX }} />

      {/* HTML5 Parallax Particles Canvas */}
      <ParticleBackground />

      {/* 3D Cyberpunk Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111119_1px,transparent_1px),linear-gradient(to_bottom,#111119_1px,transparent_1px)] bg-[size:4rem_4rem] [perspective:600px] [transform-style:preserve-3d] [transform:rotateX(60deg)_translateY(-150px)] opacity-15 pointer-events-none" />

      {/* Morphing Floating Ambient Orbs (Gradient mesh animations) */}
      <motion.div 
        animate={{
          scale: [1, 1.15, 0.9, 1],
          x: [0, 40, -30, 0],
          y: [0, -40, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-accent-violet/15 to-purple-600/5 rounded-full blur-[150px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          scale: [1, 0.9, 1.1, 1],
          x: [0, -50, 40, 0],
          y: [0, 30, -50, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-accent-cyan/12 to-blue-500/3 rounded-full blur-[140px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          scale: [1, 1.1, 0.95, 1],
          x: [0, 20, -20, 0],
          y: [0, 30, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent-rose/4 rounded-full blur-[170px] pointer-events-none z-0" 
      />

      {/* Sticky Premium Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.04] bg-[#050508]/60 px-6 lg:px-12 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8.5 h-8.5 rounded-lg bg-bg-primary flex items-center justify-center border border-white/10">
              <Code2 className="w-5.5 h-5.5 text-accent-cyan" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              CollabCode
              <span className="text-[9px] bg-accent-violet/10 border border-accent-violet/20 text-accent-violet px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Ultra
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-text-secondary hover:text-white hover:scale-102 active:scale-98 transition-all"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white overflow-hidden hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all duration-300"
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
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-32">
        
        {/* Floating Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-6 cursor-pointer"
        >
          <span className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-accent-cyan shadow-[0_0_15px_rgba(34,211,238,0.08)] hover:shadow-[0_0_25px_rgba(34,211,238,0.18)] transition-all duration-300">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" /> Next-Gen Realtime Workspace
          </span>
        </motion.div>

        {/* Word-reveal spring Headline */}
        <WordReveal text="Code Together. Build Natively." />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed font-medium text-balance"
        >
          A production-grade realtime collaborative IDE workspace equipped with 
          OT conflict resolution, live voice-responsive WebRTC channels, interactive whiteboards, 
          and sandboxed multi-language execution.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-4 relative z-20"
        >
          <Link 
            href="/signup" 
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-cyan hover:shadow-[0_0_30px_rgba(139,92,246,0.35)] text-white text-sm font-extrabold flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            Start Coding Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] text-white text-sm font-extrabold flex items-center gap-1.5 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            Enter Room
          </Link>
        </motion.div>

        {/* 3D Editor Tilt Mockup */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 w-full max-w-5xl relative group cursor-default"
        >
          {/* Neon Floor Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-2xl blur-3xl opacity-20 group-hover:opacity-35 transition duration-500" />
          
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
            transition={{ type: 'spring', stiffness: 180, damping: 25 }}
            className="relative glass-panel rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0c0c14]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)]"
          >
            {/* Mockup Header tab */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.02] select-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-accent-rose/70 hover:bg-accent-rose transition-colors cursor-pointer" />
                  <div className="w-3.5 h-3.5 rounded-full bg-accent-amber/70 hover:bg-accent-amber transition-colors cursor-pointer" />
                  <div className="w-3.5 h-3.5 rounded-full bg-accent-emerald/70 hover:bg-accent-emerald transition-colors cursor-pointer" />
                </div>
                <span className="text-[11px] text-text-muted ml-4 font-mono tracking-tight flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-accent-violet" /> main.py — CollabCode Room
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-accent-cyan/15 border border-accent-cyan/20 text-accent-cyan px-2.5 py-0.5 rounded font-mono font-extrabold tracking-wider animate-pulse">
                  2 PEERS CONNECTED
                </span>
              </div>
            </div>

            {/* Code mockup and interactive components */}
            <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[350px]">
              
              {/* Code pane */}
              <div className="lg:col-span-3 p-6 font-mono text-[13px] leading-relaxed text-left border-r border-white/[0.04] bg-[#07070d]/50 select-none">
                {liveEditorLines.map((line, idx) => (
                  <div key={idx} className={`flex items-center py-0.5 ${idx + 1 === cursorLine ? 'bg-white/[0.03] border-l-2 border-accent-cyan pl-1' : 'pl-1.5'}`}>
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
                      <span className="ml-2 px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-[10px] flex items-center gap-1 font-sans select-none animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-ping" />
                        {typingName} typing...
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Collaborative overlays preview inside the 3D card */}
              <div className="p-5 bg-white/[0.01] flex flex-col justify-between gap-5 select-none border-t lg:border-t-0 border-white/[0.04]">
                
                {/* Voice Calling panel simulation */}
                <div className="border border-white/[0.05] rounded-xl p-3.5 bg-[#0a0a0f]">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Voice & Video</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#0e0e18] px-2.5 py-1.5 rounded-lg border border-accent-emerald shadow-[0_0_8px_rgba(52,211,153,0.15)]">
                      <div className="flex items-center gap-2">
                        <span className="w-5.5 h-5.5 rounded-full bg-accent-emerald/20 text-accent-emerald flex items-center justify-center text-[9px] font-black">V</span>
                        <span className="text-[11px] font-semibold text-white">Vishal (You)</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-ping" />
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-5.5 h-5.5 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-[9px] font-black">S</span>
                        <span className="text-[11px] font-semibold text-text-secondary">soni</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Whiteboard stroke preview */}
                <div className="border border-white/[0.05] rounded-xl p-3.5 bg-[#0a0a0f] flex-1 flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center gap-2 mb-2">
                    <PenTool className="w-3.5 h-3.5 text-accent-violet" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Whiteboard Sync</span>
                  </div>
                  <div className="relative w-full h-18 border border-white/[0.04] rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
                    {/* Simulated hand drawn path */}
                    <svg className="w-full h-full stroke-accent-cyan stroke-[2] fill-none stroke-linecap-round">
                      <motion.path 
                        d="M 25 45 Q 65 15 105 45 T 195 35" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      />
                    </svg>
                    <span className="absolute bottom-1.5 right-1.5 text-[8px] bg-accent-violet/20 text-accent-violet px-1.5 py-0.5 rounded font-mono font-semibold tracking-wider">
                      DRAW DATA
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Infinite Scrolling Premium Tech logos */}
      <section className="relative z-10 border-y border-white/[0.04] bg-white/[0.01] backdrop-blur-sm py-9 overflow-hidden select-none marquee-container">
        <div className="marquee-track flex items-center gap-16 px-4">
          {/* First track set */}
          {[...Array(2)].map((_, trackIdx) => (
            <div key={trackIdx} className="flex items-center gap-16">
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <Code2 className="w-4.5 h-4.5 text-accent-violet" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">MONACO ENGINE</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <Zap className="w-4.5 h-4.5 text-accent-cyan" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">WEBSOCKET OT</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <ShieldCheck className="w-4.5 h-4.5 text-accent-emerald" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">SANDBOX RUNNER</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <Video className="w-4.5 h-4.5 text-accent-rose" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">WEBRTC VOIP</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <Layers className="w-4.5 h-4.5 text-accent-amber" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">REDIS PUBSUB</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary opacity-60 hover:opacity-100 hover:text-white transition-all duration-300">
                <GitBranch className="w-4.5 h-4.5 text-accent-violet" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">MULTI-ROOM SIGNAL</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Stats Counter Section */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto border-b border-white/[0.04]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center space-y-2.5">
            <CountingNumber value={6} suffix="+" />
            <h4 className="text-xs font-black tracking-widest uppercase text-text-secondary font-mono">LANGUAGES COMPILED</h4>
            <p className="text-[11px] text-text-muted max-w-[200px] leading-relaxed">Execute Python, JavaScript, Java, C++, Go, and Rust natively</p>
          </div>
          <div className="flex flex-col items-center space-y-2.5 border-y md:border-y-0 md:border-x border-white/[0.04] py-8 md:py-0">
            <CountingNumber value={50} suffix="ms" />
            <h4 className="text-xs font-black tracking-widest uppercase text-text-secondary font-mono">LATENCY CAP</h4>
            <p className="text-[11px] text-text-muted max-w-[200px] leading-relaxed">Operational Transformation ensures rapid sub-50ms editor synchronization</p>
          </div>
          <div className="flex flex-col items-center space-y-2.5">
            <CountingNumber value={100} suffix="%" />
            <h4 className="text-xs font-black tracking-widest uppercase text-text-secondary font-mono">PEER CONNECTED</h4>
            <p className="text-[11px] text-text-muted max-w-[200px] leading-relaxed">Instant WebRTC peer audio/video connections without setup</p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative z-10 px-6 lg:px-12 py-32 bg-[#06060c]">
        
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mb-3.5"
          >
            <span className="px-4 py-1.5 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20 text-[10px] font-bold uppercase tracking-wider">
              High Performance Specs
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Everything You Need</h2>
          <p className="mt-3.5 text-text-secondary text-sm md:text-base max-w-lg mx-auto font-medium">
            Architected specifically for software engineering teams that require sub-millisecond collaboration feedback speeds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {featuresList.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              <SpotlightCard accent={f.accent} className="h-full flex flex-col justify-between">
                <div>
                  <div className={`w-11.5 h-11.5 rounded-xl bg-gradient-to-br ${f.accent} p-[1px] mb-6 group-hover:scale-105 transition-transform duration-500`}>
                    <div className="w-full h-full rounded-xl bg-[#09090f] flex items-center justify-center">
                      <f.icon className="w-5.5 h-5.5 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-1.5">
                    {f.title}
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </h3>
                  
                  <p className="text-text-secondary text-[13px] leading-relaxed font-medium group-hover:text-text-primary transition-colors duration-300">
                    {f.desc}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works / Timeline Section */}
      <section className="relative z-10 px-6 lg:px-12 py-32 border-t border-white/[0.04] bg-[#050508]">
        <div className="text-center mb-24">
          <span className="px-4 py-1.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-[10px] font-bold uppercase tracking-wider">
            Zero Setup Timeline
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-4">How It Works</h2>
          <p className="mt-3.5 text-text-secondary text-sm md:text-base max-w-md mx-auto font-medium">
            Launch joint workspaces and share coordinates in three simple steps.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1.5px] bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald -translate-y-1/2 opacity-25 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center p-6 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] rounded-2xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-accent-violet flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Code2 className="w-6 h-6 text-accent-violet" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">1. Spawn Room Workspace</h3>
              <p className="text-[12px] text-text-secondary font-medium leading-relaxed max-w-[220px]">
                Create a secure editing sandbox workspace room from your dashboard in one click.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col items-center text-center p-6 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] rounded-2xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-accent-cyan flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Share2 className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">2. Share Live Room Coordinates</h3>
              <p className="text-[12px] text-text-secondary font-medium leading-relaxed max-w-[220px]">
                Forward the secure connection URL directly to developers. WebSockets and VoIP sync instantly.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center text-center p-6 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] rounded-2xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-accent-emerald flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <Zap className="w-6 h-6 text-accent-emerald" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">3. Code, Draw & Compile</h3>
              <p className="text-[12px] text-text-secondary font-medium leading-relaxed max-w-[220px]">
                Co-edit live, sketch vector shapes on canvas, and compile sandbox operations side-by-side.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 px-6 py-32 overflow-hidden select-none border-t border-white/[0.04] bg-[#050508]">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/5 via-accent-cyan/5 to-transparent pointer-events-none" />
        
        {/* Rotating gradient border card wrapper */}
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden animated-border-container shadow-[0_0_55px_rgba(0,0,0,0.8)]">
          <div className="animated-border-content p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-accent-violet/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-accent-cyan/20 rounded-full blur-3xl" />

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="relative z-10 space-y-7"
            >
              <div className="flex justify-center gap-1.5 text-accent-amber">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-current" />)}
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight text-balance">Ready to Code Together?</h2>
              
              <p className="text-text-secondary text-sm md:text-base max-w-lg mx-auto font-semibold leading-relaxed">
                Launch a live joint workspace session instantly. Invite collaborators with zero setup or configuration overhead.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/signup"
                  className="px-9 py-4 rounded-xl bg-white text-black hover:bg-white/90 shadow-[0_4px_25px_rgba(255,255,255,0.25)] text-sm font-extrabold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Free Room
                </Link>
                <Link
                  href="/login"
                  className="px-9 py-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-sm font-extrabold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 lg:px-12 py-14 bg-[#050508]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center border border-white/5">
                <Code2 className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-black text-white tracking-wider">CollabCode</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2 font-mono flex items-center gap-1 justify-center md:justify-start">
              Made with <Heart className="w-3 h-3 text-accent-rose fill-current" /> for modern developers.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 justify-center text-xs text-text-secondary font-medium font-mono">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">GitHub Repository</a>
            <a href="#" className="hover:text-white transition-colors">API Reference</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-[10px] text-text-muted font-mono">
            Designed Natively • Next.js & React 19 • Go WebSocket Signaling Engine
          </p>
        </div>
      </footer>

    </div>
  );
}
