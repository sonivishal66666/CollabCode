'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, 
  Sparkles, ArrowLeft, Terminal, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

    const numParticles = Math.min(Math.floor((width * height) / 15000), 50);

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

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        if (active) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            p.x -= (dx / dist) * force * 1.2;
            p.y -= (dy / dist) * force * 1.2;
            p.alpha = Math.min(p.baseAlpha + force * 0.4, 0.8);
          } else {
            p.alpha = p.baseAlpha;
          }
        } else {
          p.alpha = p.baseAlpha;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
        ctx.fill();

        particles.forEach((other) => {
          if (p === other) return;
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 95) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.04 * (1 - dist / 95)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 3D Perspective Spring tilt states
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const { signup } = useAuth();
  const router = useRouter();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Smooth 3D tilt calculation (10 degree cap)
    setRotateX(-y / (box.height / 2) * 10);
    setRotateY(x / (box.width / 2) * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, displayName);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050508] py-12 px-4 overflow-hidden selection:bg-accent-violet/30 selection:text-white">
      
      {/* HTML5 Particle Parallax Canvas */}
      <ParticleBackground />

      {/* 3D Cyberpunk Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111119_1px,transparent_1px),linear-gradient(to_bottom,#111119_1px,transparent_1px)] bg-[size:4rem_4rem] [perspective:500px] [transform-style:preserve-3d] [transform:rotateX(60deg)_translateY(-150px)] opacity-20 pointer-events-none" />

      {/* Floating Ambient Glowing Orbs */}
      <motion.div 
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-accent-cyan/15 to-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -40, 40, 0],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-accent-violet/10 to-purple-600/5 rounded-full blur-[120px] pointer-events-none z-0" 
      />

      {/* Nav corner buttons */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white hover:scale-102 active:scale-98 transition-all bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back Home
        </Link>
      </div>

      {/* Main 3D spring tilt wrapper */}
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md group cursor-default"
      >
        {/* Dynamic Shadow Glow overlay */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-emerald rounded-2xl blur-xl opacity-15 group-hover:opacity-30 transition duration-500 pointer-events-none" />
        
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
          className="relative rounded-2xl border border-white/[0.06] bg-[#0c0c14]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-8 overflow-hidden"
        >
          {/* Subtle neon glowing corner line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-emerald opacity-80" />

          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-8 select-none">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet p-[1px] cursor-pointer mb-3 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <div className="w-full h-full rounded-xl bg-[#0c0c14] flex items-center justify-center">
                <Code2 className="w-6 h-6 text-accent-violet" />
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              CollabCode
              <span className="text-[9px] bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Ultra
              </span>
            </h2>
            <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent-violet animate-pulse" /> Establish New Workspace
            </p>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-white leading-none">Create Account</h1>
            <p className="text-text-secondary text-xs mt-1.5 font-medium">Register in seconds to collaborate in real-time</p>
          </div>

          {/* Warning Error Drone slide-in overlay */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mb-5 overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-semibold flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.08)]">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold uppercase block tracking-wider mb-0.5">Registration Error</span>
                    <span className="opacity-90">{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Display Name Field */}
            <div className="group/field">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within/field:text-accent-emerald transition-colors mb-2 block">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <User className="w-4 h-4 text-text-muted group-focus-within/field:text-accent-emerald transition-colors" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/[0.06] rounded-xl text-white placeholder-text-muted/40 focus:outline-none focus:border-accent-emerald focus:ring-2 focus:ring-accent-emerald/20 focus:shadow-[0_0_15px_rgba(52,211,153,0.12)] transition-all duration-300 font-medium"
                  placeholder="John Doe"
                  required
                  minLength={2}
                />
                {/* Glowing subtle focus indicator bar */}
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-accent-emerald/30 to-transparent scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300" />
              </div>
            </div>
            
            {/* Email Field */}
            <div className="group/field">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within/field:text-accent-cyan transition-colors mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <Mail className="w-4 h-4 text-text-muted group-focus-within/field:text-accent-cyan transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/[0.06] rounded-xl text-white placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20 focus:shadow-[0_0_15px_rgba(34,211,238,0.12)] transition-all duration-300 font-medium"
                  placeholder="you@example.com"
                  required
                />
                {/* Glowing subtle focus indicator bar */}
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300" />
              </div>
            </div>

            {/* Password Field */}
            <div className="group/field">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within/field:text-accent-violet transition-colors mb-2 block">
                Choose Secure Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <Lock className="w-4 h-4 text-text-muted group-focus-within/field:text-accent-violet transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 text-sm bg-black/40 border border-white/[0.06] rounded-xl text-white placeholder-text-muted/40 focus:outline-none focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/20 focus:shadow-[0_0_15px_rgba(139,92,246,0.12)] transition-all duration-300 font-medium"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
                {/* Custom toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
                {/* Glowing focus bar */}
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-accent-violet/30 to-transparent scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300" />
              </div>
            </div>

            {/* Premium Submit Button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="w-full mt-6 relative group/btn overflow-hidden rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-65 cursor-pointer"
            >
              {/* Dynamic shining background gradient shift */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-cyan bg-[size:200%_auto] group-hover/btn:animate-gradient-shift transition-all" />
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> Allocating Environment...
                  </>
                ) : (
                  <>
                    Initialize Account <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center select-none">
            <p className="text-xs text-text-secondary font-medium">
              Already registered in a room?{' '}
              <Link 
                href="/login" 
                className="text-accent-cyan hover:text-accent-violet hover:underline transition-all duration-300 font-bold"
              >
                Sign in instead
              </Link>
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-text-muted font-mono">
              <Terminal className="w-3.5 h-3.5 text-accent-violet" /> Secure Environment Provisioning Active
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
