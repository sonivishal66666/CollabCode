'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, 
  Sparkles, ArrowLeft, Terminal, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 3D Perspective Spring tilt states
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const { login } = useAuth();
  const router = useRouter();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Smooth 3D tilt calculation (12 degree cap)
    setRotateX(-y / (box.height / 2) * 12);
    setRotateY(x / (box.width / 2) * 12);
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
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050508] py-12 px-4 overflow-hidden selection:bg-accent-violet/30 selection:text-white">
      
      {/* 3D Cyberpunk Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111119_1px,transparent_1px),linear-gradient(to_bottom,#111119_1px,transparent_1px)] bg-[size:4rem_4rem] [perspective:500px] [transform-style:preserve-3d] [transform:rotateX(60deg)_translateY(-150px)] opacity-20 pointer-events-none" />

      {/* Floating Ambient Glowing Orbs */}
      <motion.div 
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-accent-violet/15 to-purple-600/5 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          x: [0, -30, 50, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-accent-cyan/10 to-blue-500/5 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* Nav corner buttons */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-xl backdrop-blur-md"
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
        <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald rounded-2xl blur-xl opacity-15 group-hover:opacity-30 transition duration-500 pointer-events-none" />
        
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
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald opacity-80" />

          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-8 select-none">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan p-[1px] cursor-pointer mb-3 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              <div className="w-full h-full rounded-xl bg-[#0c0c14] flex items-center justify-center">
                <Code2 className="w-6 h-6 text-accent-cyan" />
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              CollabCode
              <span className="text-[9px] bg-accent-violet/10 border border-accent-violet/20 text-accent-violet px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Ultra
              </span>
            </h2>
            <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent-cyan animate-pulse" /> Access Team Workspaces
            </p>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-white leading-none">Welcome Back</h1>
            <p className="text-text-secondary text-xs mt-1.5 font-medium">Verify credentials to unlock real-time features</p>
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
                    <span className="font-bold uppercase block tracking-wider mb-0.5">Authorization Error</span>
                    <span className="opacity-90">{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
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
                  className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/[0.06] rounded-xl text-white placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20 transition-all duration-300 font-medium"
                  placeholder="you@example.com"
                  required
                />
                {/* Glowing subtle hover grid indicator */}
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300" />
              </div>
            </div>

            {/* Password Field */}
            <div className="group/field">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within/field:text-accent-violet transition-colors block">
                  Secure Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <Lock className="w-4 h-4 text-text-muted group-focus-within/field:text-accent-violet transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 text-sm bg-black/40 border border-white/[0.06] rounded-xl text-white placeholder-text-muted/40 focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet/20 transition-all duration-300 font-medium"
                  placeholder="••••••••"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 relative group/btn overflow-hidden rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-65"
            >
              {/* Dynamic shining background gradient shift */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet bg-[size:200%_auto] group-hover/btn:animate-gradient-shift transition-all" />
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> Authenticating Session...
                  </>
                ) : (
                  <>
                    Establish Connection <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center select-none">
            <p className="text-xs text-text-secondary font-medium">
              Don&apos;t have an workspace account?{' '}
              <Link 
                href="/signup" 
                className="text-accent-cyan hover:text-accent-violet hover:underline transition-all duration-300 font-bold"
              >
                Sign up free
              </Link>
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-text-muted font-mono">
              <Terminal className="w-3.5 h-3.5 text-accent-violet" /> TLS Encrypted Signaling WebSocket Enabled
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
