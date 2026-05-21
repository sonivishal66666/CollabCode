'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Copy, Check, Users, MessageSquare, ArrowLeft,
  Settings, Save, Loader2, ChevronDown, Clock, Terminal,
  Send, X, Circle, Timer, FileCode, Volume2, VolumeX,
  Sparkles, Moon, Sun, Laptop, Video, PenTool
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEditorStore } from '@/stores/editorStore';
import type { WSMessage, PresenceData, CursorData, SyncPayload } from '@/types';
import { FileExplorer } from './components/FileExplorer';
import { EditorTabs } from './components/EditorTabs';
import { useRemoteDecorations } from '@/hooks/useRemoteDecorations';
import { audio } from '@/lib/audio';

// Collaborative components
import { CommandPalette } from './components/CommandPalette';
import { Whiteboard } from './components/Whiteboard';
import { TimeMachine } from './components/TimeMachine';
import { VideoCall } from './components/VideoCall';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const languageMap: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  java: 'java',
  typescript: 'typescript',
  go: 'go',
};

const monacoLanguageMap: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  java: 'java',
  typescript: 'typescript',
  go: 'go',
};

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
}

function triggerConfetti(canvas: HTMLCanvasElement, theme: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colorsMap: Record<string, string[]> = {
    midnight: ['#8b5cf6', '#22d3ee', '#34d399', '#fb7185', '#fbbf24'],
    cyberpunk: ['#ff007f', '#00f0ff', '#fefe22', '#39ff14', '#ab57bb'],
    'tokyo-night': ['#7aa2f7', '#bb9af3', '#7dcfff', '#9ece6a', '#ff9e64'],
    dracula: ['#bd93f9', '#ff5555', '#50fa7b', '#f1fa8c', '#8be9fd'],
  };
  const colors = colorsMap[theme] || colorsMap.midnight;

  // Set initial dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: ConfettiParticle[] = [];

  const addBurst = (x: number, y: number, isLeft: boolean) => {
    for (let i = 0; i < 90; i++) {
      const angle = isLeft
        ? -Math.PI * 0.25 - Math.random() * Math.PI * 0.2 // shoot right-upwards (-45deg to -81deg)
        : -Math.PI * 0.75 + Math.random() * Math.PI * 0.2; // shoot left-upwards (-135deg to -99deg)
      const speed = Math.random() * 16 + 12;
      const size = Math.random() * 8 + 6;
      const decay = Math.random() * 0.012 + 0.008;

      particles.push({
        x,
        y,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as any,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4,
        opacity: 1,
        decay,
      });
    }
  };

  addBurst(0, canvas.height, true);
  addBurst(canvas.width, canvas.height, false);

  let animId: number;
  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    particles.forEach((p) => {
      // update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // friction
      p.vy *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      if (p.opacity > 0) {
        alive = true;
        // draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'triangle') {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    });

    if (alive) {
      animId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  loop();
}

function InterviewTimer({ isInterview }: { isInterview: boolean }) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  if (!isInterview) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        setTimerRunning(!timerRunning);
        audio.playClick();
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
        timerRunning ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' : 'bg-bg-tertiary text-text-secondary'
      }`}
    >
      <Timer className="w-3 h-3" />
      {formatTime(time)}
    </motion.button>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuth();

  const [room, setRoom] = useState<{ room: { id: string; name: string; room_code: string; language: string; is_interview: boolean }; participants: Array<{ user_id: string; display_name: string; role: string }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; user_id: string; content: string; display_name: string; created_at: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [theme, setThemeState] = useState<'midnight' | 'cyberpunk' | 'tokyo-night' | 'dracula'>('midnight');
  
  // Responsive States
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'explorer' | 'chat' | 'whiteboard' | 'call'>('editor');
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Performance optimized Event-driven typing indicator tracking
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const triggerUserTyping = useCallback((userId: string) => {
    setTypingUsers(prev => {
      if (prev[userId]) return prev;
      return { ...prev, [userId]: true };
    });
    
    if (typingTimeouts.current[userId]) {
      clearTimeout(typingTimeouts.current[userId]);
    }
    
    typingTimeouts.current[userId] = setTimeout(() => {
      setTypingUsers(prev => {
        if (!prev[userId]) return prev;
        return { ...prev, [userId]: false };
      });
    }, 2000);
  }, []);

  const triggerSelfTyping = useCallback(() => {
    setTypingUsers(prev => {
      if (prev.self) return prev;
      return { ...prev, self: true };
    });
    
    if (typingTimeouts.current.self) {
      clearTimeout(typingTimeouts.current.self);
    }
    
    typingTimeouts.current.self = setTimeout(() => {
      setTypingUsers(prev => {
        if (!prev.self) return prev;
        return { ...prev, self: false };
      });
    }, 2000);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = typingTimeouts.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collabcode_muted') === 'true';
      setMutedState(saved);
      audio.setMuted(saved);

      const savedTheme = localStorage.getItem('collabcode_theme') as any;
      if (savedTheme && ['midnight', 'cyberpunk', 'tokyo-night', 'dracula'].includes(savedTheme)) {
        setThemeState(savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    }
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    audio.setMuted(next);
    localStorage.setItem('collabcode_muted', String(next));
    if (!next) {
      audio.playPop();
    }
  };

  const changeTheme = (newTheme: 'midnight' | 'cyberpunk' | 'tokyo-night' | 'dracula') => {
    setThemeState(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('collabcode_theme', newTheme);
    audio.playClick();
  };

  const {
    files, activeFileId, openTabs, language, isExecuting, executionResult, onlineUsers,
    setFiles, updateFileContent, updateFileVersion, setLanguage, setExecuting, setExecutionResult,
    addOnlineUser, removeOnlineUser, updateUserCursor, clearOnlineUsers, openTab, addFile, removeFile,
    showWhiteboard, setShowWhiteboard, showTimeMachine, setShowTimeMachine, showVideoCall, setShowVideoCall,
    showCommandPalette, setShowCommandPalette, addRevision
  } = useEditorStore();

  useEffect(() => {
    if (!showWhiteboard && activeMobileTab === 'whiteboard') {
      setActiveMobileTab('editor');
    }
  }, [showWhiteboard, activeMobileTab]);

  useEffect(() => {
    if (!showVideoCall && activeMobileTab === 'call') {
      setActiveMobileTab('editor');
    }
  }, [showVideoCall, activeMobileTab]);

  const editorRef = useRef<unknown>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isRemoteChange = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revisionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useRemoteDecorations({
    editor: editorInstance,
    monaco: monacoInstance,
    onlineUsers,
    activeFileId,
  });

  // Capture original version of active file if no revisions exist yet
  useEffect(() => {
    if (activeFileId) {
      const file = files[activeFileId];
      if (file && file.content) {
        const revisions = useEditorStore.getState().fileRevisions[activeFileId] || [];
        if (revisions.length === 0) {
          addRevision(activeFileId, file.content, 'Original Version');
        }
      }
    }
  }, [activeFileId, files, addRevision]);

  useEffect(() => {
    if (monacoInstance) {
      // Define Cyberpunk Theme
      monacoInstance.editor.defineTheme('collabcode-cyberpunk', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: 'ab57bb', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff007f', fontStyle: 'bold' },
          { token: 'string', foreground: 'fefe22' },
          { token: 'number', foreground: '39ff14' },
          { token: 'regexp', foreground: '00f0ff' },
          { token: 'type', foreground: '00f0ff' },
          { token: 'class', foreground: '00f0ff' },
          { token: 'function', foreground: '00f0ff' },
          { token: 'variable', foreground: 'a9b1d6' },
        ],
        colors: {
          'editor.background': '#120e2e',
          'editor.foreground': '#00f0ff',
          'editor.lineHighlightBackground': '#1a103c',
          'editorCursor.foreground': '#ff007f',
          'editor.selectionBackground': '#ff007f33',
          'editor.inactiveSelectionBackground': '#ff007f1a',
        },
      });

      // Define Tokyo Night Theme
      monacoInstance.editor.defineTheme('collabcode-tokyo-night', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'bb9af3' },
          { token: 'string', foreground: '9ece6a' },
          { token: 'number', foreground: 'ff9e64' },
          { token: 'regexp', foreground: '7dcfff' },
          { token: 'type', foreground: '2ac3de' },
          { token: 'class', foreground: '2ac3de' },
          { token: 'function', foreground: '7aa2f7' },
          { token: 'variable', foreground: 'c0caf5' },
        ],
        colors: {
          'editor.background': '#1a1b26',
          'editor.foreground': '#a9b1d6',
          'editor.lineHighlightBackground': '#1f2335',
          'editorCursor.foreground': '#c0caf5',
          'editor.selectionBackground': '#51597e55',
          'editor.inactiveSelectionBackground': '#51597e22',
        },
      });

      // Define Dracula Theme
      monacoInstance.editor.defineTheme('collabcode-dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'regexp', foreground: 'ffb86c' },
          { token: 'type', foreground: '8be9fd' },
          { token: 'class', foreground: '8be9fd' },
          { token: 'function', foreground: '50fa7b' },
          { token: 'variable', foreground: 'f8f8f2' },
        ],
        colors: {
          'editor.background': '#282a36',
          'editor.foreground': '#f8f8f2',
          'editor.lineHighlightBackground': '#343746',
          'editorCursor.foreground': '#f8f8f0',
          'editor.selectionBackground': '#44475a88',
          'editor.inactiveSelectionBackground': '#44475a44',
        },
      });

      // Define Midnight Theme
      monacoInstance.editor.defineTheme('collabcode-midnight', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '55556a', fontStyle: 'italic' },
          { token: 'keyword', foreground: '8b5cf6' },
          { token: 'string', foreground: '34d399' },
          { token: 'number', foreground: '22d3ee' },
          { token: 'regexp', foreground: '22d3ee' },
          { token: 'type', foreground: '22d3ee' },
          { token: 'class', foreground: '22d3ee' },
          { token: 'function', foreground: '22d3ee' },
          { token: 'variable', foreground: 'f0f0f5' },
        ],
        colors: {
          'editor.background': '#0a0a0f',
          'editor.foreground': '#f0f0f5',
          'editor.lineHighlightBackground': '#111118',
          'editorCursor.foreground': '#8b5cf6',
          'editor.selectionBackground': '#8b5cf633',
          'editor.inactiveSelectionBackground': '#8b5cf61a',
        },
      });
    }
  }, [monacoInstance]);
  
  // Per-file OT tracking
  const isAwaitingAck = useRef<Record<string, boolean>>({});
  const pendingCodeChange = useRef<Record<string, string | null>>({});
  const lastAckedCode = useRef<Record<string, string>>({});

  // Load room data
  useEffect(() => {
    api.getRoom(roomId)
      .then((data) => {
        setRoom(data);
        setLanguage(data.room.language);
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));

    api.getMessages(roomId).then(setMessages).catch(console.error);

    return () => clearOnlineUsers();
  }, [roomId, router, setLanguage, clearOnlineUsers]);
  const handleWSMessageRef = useRef<(msg: WSMessage) => void>(undefined);

  const { sendMessage } = useWebSocket({
    roomId,
    onMessage: (msg) => handleWSMessageRef.current?.(msg),
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  // WebSocket message handler
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'sync:full': {
        const payload = msg.payload as SyncPayload;
        isRemoteChange.current = true;
        
        const mappedFiles = Object.fromEntries(
          Object.entries(payload.files).map(([id, state]) => [
            id, { id, name: id.split('/').pop() || id, content: state.content, version: state.version }
          ])
        );
        
        setFiles(mappedFiles);
        
        // Initialize tracking refs for all files
        Object.entries(payload.files).forEach(([id, state]) => {
          lastAckedCode.current[id] = state.content;
          isAwaitingAck.current[id] = false;
          pendingCodeChange.current[id] = null;
        });

        // Open first file if none open
        const fileIds = Object.keys(mappedFiles);
        if (fileIds.length > 0 && !activeFileId) {
          openTab(fileIds[0]);
        }
        
        setTimeout(() => { isRemoteChange.current = false; }, 50);
        break;
      }
      case 'ot:operation': {
        const payload = msg.payload as { ops: Array<{ type: number; count?: number; text?: string }>; version: number };
        const fileId = msg.file_id;
        if (!fileId) return;

        updateFileVersion(fileId, payload.version);
        
        // Apply remote operation to editor if it's the active file
        if (activeFileId === fileId && editorRef.current) {
          const editor = editorRef.current as { getModel: () => { getValue: () => string; pushEditOperations: (arg0: null, arg1: Array<{ range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string }>, arg2: () => null) => void }; getPosition: () => { lineNumber: number; column: number } };
          const model = editor.getModel();
          if (model) {
            let pos = 0;
            const content = model.getValue();
            const edits: Array<{ range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string }> = [];
            
            for (const op of payload.ops) {
              if (op.type === 0) { // Retain
                pos += op.count || 0;
              } else if (op.type === 1) { // Insert
                const posInfo = getPositionFromOffset(content, pos);
                edits.push({
                  range: {
                    startLineNumber: posInfo.line,
                    startColumn: posInfo.col,
                    endLineNumber: posInfo.line,
                    endColumn: posInfo.col,
                  },
                  text: op.text || '',
                });
                // pos is NOT incremented because Insert does not consume original characters
              } else if (op.type === 2) { // Delete
                const startPos = getPositionFromOffset(content, pos);
                const endPos = getPositionFromOffset(content, pos + (op.count || 0));
                edits.push({
                  range: {
                    startLineNumber: startPos.line,
                    startColumn: startPos.col,
                    endLineNumber: endPos.line,
                    endColumn: endPos.col,
                  },
                  text: '',
                });
                pos += op.count || 0; // Delete consumes original characters
              }
            }

            if (edits.length > 0) {
              isRemoteChange.current = true;
              model.pushEditOperations(null, edits, () => null);
              const newValue = model.getValue();
              updateFileContent(fileId, newValue);
              lastAckedCode.current[fileId] = newValue;
              setTimeout(() => { isRemoteChange.current = false; }, 50);
            }
          }
        } else {
          // File is not active, apply transformation in background
          const currentContent = useEditorStore.getState().files[fileId]?.content || '';
          // We would normally do full OT background apply here.
          // For simplicity, we trigger a request for full sync of this file or apply it directly 
          // Since the client didn't edit this file, it's just base + op = target.
          // Rebuilding the string manually:
          let result = '';
          let sourceIdx = 0;
          for (const op of payload.ops) {
            if (op.type === 0) {
              result += currentContent.slice(sourceIdx, sourceIdx + (op.count || 0));
              sourceIdx += op.count || 0;
            } else if (op.type === 1) {
              result += op.text || '';
            } else if (op.type === 2) {
              sourceIdx += op.count || 0;
            }
          }
          result += currentContent.slice(sourceIdx);
          updateFileContent(fileId, result);
          lastAckedCode.current[fileId] = result;
        }
        break;
      }
      case 'ot:ack': {
        const payload = msg.payload as { version: number };
        const fileId = msg.file_id;
        if (!fileId) return;

        updateFileVersion(fileId, payload.version);
        isAwaitingAck.current[fileId] = false;
        
        if (pendingCodeChange.current[fileId] !== null && pendingCodeChange.current[fileId] !== undefined) {
          const newCode = pendingCodeChange.current[fileId] as string;
          pendingCodeChange.current[fileId] = null;
          
          const prevCode = lastAckedCode.current[fileId] || '';
          const newLen = newCode.length;
          const prevLen = prevCode.length;
          
          if (prevCode !== newCode) {
            let start = 0;
            while (start < prevLen && start < newLen && prevCode[start] === newCode[start]) start++;
            
            let endPrev = prevLen - 1;
            let endCurr = newLen - 1;
            while (endPrev >= start && endCurr >= start && prevCode[endPrev] === newCode[endCurr]) {
              endPrev--;
              endCurr--;
            }

            const deletedLen = endPrev - start + 1;
            const insertedText = newCode.substring(start, endCurr + 1);
            const suffixLen = prevLen - 1 - endPrev;

            const ops = [];
            if (start > 0) ops.push({ type: 0, count: start });
            if (deletedLen > 0) ops.push({ type: 2, count: deletedLen });
            if (insertedText.length > 0) ops.push({ type: 1, text: insertedText });
            if (suffixLen > 0) ops.push({ type: 0, count: suffixLen });
            
            lastAckedCode.current[fileId] = newCode;
            isAwaitingAck.current[fileId] = true;
            
            sendMessage({
              type: 'ot:operation',
              file_id: fileId,
              payload: {
                ops,
                version: payload.version,
                base_len: prevLen,
                target_len: newLen,
              },
            });
          }
        }
        break;
      }
      case 'presence': {
        const payload = msg.payload as PresenceData;
        if (payload.action === 'join') {
          addOnlineUser({ user_id: payload.user_id, display_name: payload.display_name, avatar_url: payload.avatar_url });
        } else if (payload.action === 'leave') {
          removeOnlineUser(payload.user_id);
        }
        break;
      }
      case 'cursor': {
        const payload = msg.payload as CursorData;
        updateUserCursor(payload.user_id, { ...payload, file_id: msg.file_id });
        if (payload.user_id) {
          triggerUserTyping(payload.user_id);
        }
        break;
      }
      case 'chat': {
        const payload = msg.payload as { message_id: string; content: string; user_id: string; display_name: string; timestamp: string };
        if (payload.user_id !== user?.id) {
          audio.playChime();
        }
        setMessages(prev => {
          if (prev.some(m => m.id === payload.message_id)) return prev;
          return [...prev, {
            id: payload.message_id,
            user_id: payload.user_id,
            content: payload.content,
            display_name: payload.display_name,
            created_at: payload.timestamp,
          }];
        });
        break;
      }
      case 'workspace:update': {
        const payload = msg.payload as { action: string; file_id: string; content?: string };
        if (payload.action === 'create') {
          const fileId = payload.file_id;
          const content = payload.content || '';
          addFile({ id: fileId, name: fileId.split('/').pop() || fileId, content, version: 0 });
          lastAckedCode.current[fileId] = content;
          isAwaitingAck.current[fileId] = false;
          pendingCodeChange.current[fileId] = null;
        } else if (payload.action === 'delete') {
          removeFile(payload.file_id);
          delete lastAckedCode.current[payload.file_id];
          delete isAwaitingAck.current[payload.file_id];
          delete pendingCodeChange.current[payload.file_id];
        }
        break;
      }
      case 'draw:stroke': {
        window.dispatchEvent(new CustomEvent('ws:draw:stroke', { detail: msg }));
        break;
      }
      case 'webrtc:signal': {
        window.dispatchEvent(new CustomEvent('ws:webrtc:signal', { detail: msg }));
        break;
      }
    }
  }, [setFiles, updateFileContent, updateFileVersion, activeFileId, openTab, addFile, removeFile, addOnlineUser, removeOnlineUser, updateUserCursor, sendMessage]);

  useEffect(() => {
    handleWSMessageRef.current = handleWSMessage;
  }, [handleWSMessage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (isRemoteChange.current || value === undefined || !activeFileId) return;
    
    // Set self typing status
    triggerSelfTyping();
    
    updateFileContent(activeFileId, value);
    
    // Throttled background revision history capturing
    if (revisionTimeoutRef.current) clearTimeout(revisionTimeoutRef.current);
    revisionTimeoutRef.current = setTimeout(() => {
      if (activeFileId && value) {
        addRevision(activeFileId, value, user?.display_name || 'Collaborator');
      }
    }, 4000);
    
    if (isAwaitingAck.current[activeFileId]) {
      pendingCodeChange.current[activeFileId] = value;
      return;
    }
    
    const prevCode = lastAckedCode.current[activeFileId] || '';
    if (prevCode === value) return;
    
    const prevLen = prevCode.length;
    const newLen = value.length;
    
    let start = 0;
    while (start < prevLen && start < newLen && prevCode[start] === value[start]) start++;
    
    let endPrev = prevLen - 1;
    let endCurr = newLen - 1;
    while (endPrev >= start && endCurr >= start && prevCode[endPrev] === value[endCurr]) {
      endPrev--;
      endCurr--;
    }

    const deletedLen = endPrev - start + 1;
    const insertedText = value.substring(start, endCurr + 1);
    const suffixLen = prevLen - 1 - endPrev;

    const ops = [];
    if (start > 0) ops.push({ type: 0, count: start });
    if (deletedLen > 0) ops.push({ type: 2, count: deletedLen });
    if (insertedText.length > 0) ops.push({ type: 1, text: insertedText });
    if (suffixLen > 0) ops.push({ type: 0, count: suffixLen });

    lastAckedCode.current[activeFileId] = value;
    isAwaitingAck.current[activeFileId] = true;

    sendMessage({
      type: 'ot:operation',
      file_id: activeFileId,
      payload: {
        ops,
        version: useEditorStore.getState().files[activeFileId]?.version || 0,
        base_len: prevLen,
        target_len: newLen,
      },
    });
  }, [activeFileId, updateFileContent, sendMessage, addRevision, user]);

  const handleCursorChange = useCallback((e: unknown) => {
    if (!activeFileId) return;
    const event = e as { position: { lineNumber: number; column: number }; selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } };
    sendMessage({
      type: 'cursor',
      file_id: activeFileId,
      payload: {
        line: event.position.lineNumber,
        column: event.position.column,
        user_id: user?.id,
        user_name: user?.display_name,
        file_id: activeFileId,
        selection: event.selection ? {
          start_line: event.selection.startLineNumber,
          start_column: event.selection.startColumn,
          end_line: event.selection.endLineNumber,
          end_column: event.selection.endColumn,
        } : undefined,
      },
    });
  }, [sendMessage, user, activeFileId]);

  const handleExecute = async () => {
    setExecuting(true);
    setShowOutput(true);
    setExecutionResult(null);
    audio.playStart();
    try {
      const filesArray = Object.entries(files).map(([name, f]) => ({ name, content: f.content }));
      const result = await api.executeCode(roomId, language, filesArray, stdinInput);
      setExecutionResult(result);
      if (result.exit_code === 0) {
        audio.playSuccess();
        if (canvasRef.current) {
          triggerConfetti(canvasRef.current, theme);
        }
      } else {
        audio.playAlert();
      }
      // Broadcast execution result
      sendMessage({
        type: 'exec:result',
        payload: result,
      });
    } catch (err) {
      audio.playAlert();
      setExecutionResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exit_code: 1,
        execution_time_ms: 0,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    audio.playPop();
    const msg = {
      message_id: crypto.randomUUID(),
      content: chatInput.trim(),
      user_id: user?.id || '',
      display_name: user?.display_name || '',
      timestamp: new Date().toISOString(),
    };
    sendMessage({ type: 'chat', payload: msg });
    setMessages(prev => [...prev, {
      id: msg.message_id,
      user_id: msg.user_id,
      content: msg.content,
      display_name: msg.display_name,
      created_at: msg.timestamp,
    }]);
    setChatInput('');
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.room.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      if (activeFileId && files[activeFileId]) {
        await api.saveSnapshot(roomId, files[activeFileId].content, language);
      }
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  };

  const handleRestoreContent = (restoredContent: string) => {
    if (!activeFileId) return;
    if (editorRef.current) {
      const editor = editorRef.current as any;
      const model = editor.getModel();
      if (model) {
        model.setValue(restoredContent);
      }
    } else {
      updateFileContent(activeFileId, restoredContent);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent-violet" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Top bar — Premium glassmorphism header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default glass-panel-strong shrink-0 relative overflow-hidden">
        {/* Subtle gradient shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/[0.03] via-transparent to-accent-cyan/[0.03] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">{room?.room.name}</h1>
              <span className="text-[10px] bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded font-mono">
                {language}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <motion.span
                animate={{ scale: connected ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.5, repeat: connected ? 0 : Infinity, repeatDelay: 1 }}
                className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent-emerald' : 'bg-accent-rose'}`}
              />
              {connected ? 'Connected' : 'Reconnecting...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative z-10">
          {/* Interview timer */}
          <InterviewTimer isInterview={room?.room.is_interview || false} />

          {/* Desktop-only action group */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium outline-none cursor-pointer hover:border-border-hover transition-colors"
            >
              {Object.entries(languageMap).map(([key]) => (
                <option key={key} value={key} className="bg-bg-tertiary text-text-primary">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
              ))}
            </select>

            {/* Theme selector */}
            <div className="flex items-center gap-1 bg-bg-tertiary border border-border-default rounded-lg px-2 py-1.5 hover:border-border-hover transition-all duration-200">
              <Sparkles className="w-3.5 h-3.5 text-accent-violet animate-pulse shrink-0" />
              <select
                value={theme}
                onChange={(e) => changeTheme(e.target.value as any)}
                className="bg-transparent text-xs font-medium outline-none cursor-pointer border-none text-text-primary py-0 pr-1 pl-0.5"
              >
                <option value="midnight" className="bg-bg-tertiary text-text-primary">🌌 Midnight</option>
                <option value="cyberpunk" className="bg-bg-tertiary text-text-primary">⚡ Cyberpunk</option>
                <option value="tokyo-night" className="bg-bg-tertiary text-text-primary">🏮 Tokyo Night</option>
                <option value="dracula" className="bg-bg-tertiary text-text-primary">🧛 Dracula</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveSnapshot}
              className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5"
              title="Save snapshot"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyRoomCode}
              className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 font-mono"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-3.5 h-3.5 text-accent-emerald" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
              #{room?.room.room_code}
            </motion.button>
          </div>

          {/* Online users — responsive (always shown) */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-border-default">
            <div className="flex -space-x-1.5">
              {Array.from(onlineUsers.values()).slice(0, 3).map((u) => {
                const isTyping = typingUsers[u.user_id];
                return (
                  <motion.div
                    key={u.user_id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-primary cursor-default relative transition-all duration-300 ${
                      isTyping ? 'ring-2 ring-accent-violet ring-offset-1 ring-offset-bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.6)]' : ''
                    }`}
                    title={`${u.display_name}${isTyping ? ' (Typing...)' : ''}`}
                  >
                    {u.display_name?.charAt(0).toUpperCase()}
                    {isTyping && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-violet opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-violet"></span>
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {/* Self */}
              {(() => {
                const isSelfTyping = typingUsers.self;
                return (
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-br from-accent-emerald to-accent-cyan flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-primary relative transition-all duration-300 ${
                      isSelfTyping ? 'ring-2 ring-accent-emerald ring-offset-1 ring-offset-bg-primary animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]' : ''
                    }`}
                    title={`You${isSelfTyping ? ' (Typing...)' : ''}`}
                  >
                    {user?.display_name?.charAt(0).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-emerald rounded-full border-2 border-bg-primary" />
                  </div>
                );
              })()}
            </div>
            <span className="text-xs text-text-muted font-medium hidden sm:inline">{onlineUsers.size + 1}</span>
          </div>

          {/* Desktop-only action icons */}
          <div className="hidden md:flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowVideoCall(!showVideoCall); audio.playClick(); }}
              className={`p-2 rounded-lg transition-all ${showVideoCall ? 'bg-accent-cyan/10 text-accent-cyan' : 'hover:bg-white/5 text-text-secondary'}`}
              title="Toggle Voice & Video Call"
            >
              <Video className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowWhiteboard(!showWhiteboard); audio.playClick(); }}
              className={`p-2 rounded-lg transition-all ${showWhiteboard ? 'bg-accent-violet/10 text-accent-violet' : 'hover:bg-white/5 text-text-secondary'}`}
              title="Toggle Collaborative Whiteboard"
            >
              <PenTool className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowTimeMachine(!showTimeMachine); audio.playClick(); }}
              className={`p-2 rounded-lg transition-all ${showTimeMachine ? 'bg-accent-cyan/10 text-accent-cyan' : 'hover:bg-white/5 text-text-secondary'}`}
              title="Toggle Workspace Time Machine"
            >
              <Clock className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCommandPalette(!showCommandPalette); audio.playClick(); }}
              className={`p-2 rounded-lg transition-all ${showCommandPalette ? 'bg-accent-violet/10 text-accent-violet' : 'hover:bg-white/5 text-text-secondary'}`}
              title="Toggle Command Palette (Ctrl+K)"
            >
              <Terminal className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-all ${!muted ? 'hover:bg-white/5 text-text-secondary' : 'bg-accent-rose/10 text-accent-rose'}`}
              title={muted ? "Unmute Sounds" : "Mute Sounds"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-all ${showChat ? 'bg-accent-violet/10 text-accent-violet' : 'hover:bg-white/5 text-text-secondary'}`}
            >
              <MessageSquare className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Premium Mobile Menu settings button */}
          <div className="md:hidden relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowMobileSettings(!showMobileSettings); audio.playClick(); }}
              className={`p-2 rounded-lg transition-all ${showMobileSettings ? 'bg-bg-tertiary text-accent-violet' : 'bg-bg-tertiary/50 border border-border-default text-text-secondary hover:text-text-primary'}`}
            >
              <Settings className="w-4 h-4" />
            </motion.button>
            
            <AnimatePresence>
              {showMobileSettings && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowMobileSettings(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-bg-secondary/95 backdrop-blur-xl border border-border-default shadow-2xl p-2 z-50 flex flex-col gap-2"
                  >
                    <div className="px-3 py-1.5 border-b border-border-default/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Workspace Settings</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 px-2">
                      <span className="text-[10px] text-text-muted font-medium">Language</span>
                      <select
                        value={language}
                        onChange={(e) => { setLanguage(e.target.value); setShowMobileSettings(false); }}
                        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-2 py-1.5 text-xs font-medium outline-none cursor-pointer text-text-primary"
                      >
                        {Object.entries(languageMap).map(([key]) => (
                          <option key={key} value={key} className="bg-bg-tertiary text-text-primary">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 px-2">
                      <span className="text-[10px] text-text-muted font-medium">Theme</span>
                      <select
                        value={theme}
                        onChange={(e) => { changeTheme(e.target.value as any); setShowMobileSettings(false); }}
                        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-2 py-1.5 text-xs font-medium outline-none cursor-pointer text-text-primary"
                      >
                        <option value="midnight">🌌 Midnight</option>
                        <option value="cyberpunk">⚡ Cyberpunk</option>
                        <option value="tokyo-night">🏮 Tokyo Night</option>
                        <option value="dracula">🧛 Dracula</option>
                      </select>
                    </div>

                    <div className="border-t border-border-default/40 my-1" />

                    <button
                      onClick={() => { handleSaveSnapshot(); setShowMobileSettings(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Snapshot
                    </button>

                    <button
                      onClick={() => { copyRoomCode(); setShowMobileSettings(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary flex items-center gap-2 font-mono"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                      #{room?.room.room_code}
                    </button>

                    <button
                      onClick={() => { toggleMute(); setShowMobileSettings(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary flex items-center gap-2"
                    >
                      {muted ? <VolumeX className="w-3.5 h-3.5 text-accent-rose" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {muted ? "Unmute Sounds" : "Mute Sounds"}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 pb-16 md:pb-0">
        
        {/* File Explorer Sidebar */}
        <div className={`${activeMobileTab === 'explorer' ? 'flex w-full h-full' : 'hidden'} md:flex md:w-64 shrink-0`}>
          <FileExplorer sendMessage={sendMessage} />
        </div>

        {/* Editor + Output */}
        <div className={`${activeMobileTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 border-r border-border-default`}>
          <EditorTabs />
          
          {/* Editor */}
          <div className={`${showOutput ? 'flex-1' : 'flex-1'} min-h-0 bg-bg-primary`}>
            {activeFileId ? (
              <MonacoEditor
                height="100%"
                language={monacoLanguageMap[language] || 'plaintext'}
                value={files[activeFileId]?.content || ''}
                path={activeFileId}
                onChange={handleEditorChange}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  setEditorInstance(editor);
                  setMonacoInstance(monaco);
                  editor.onDidChangeCursorPosition(handleCursorChange);
                  editor.onDidChangeCursorSelection((e: any) => {
                    handleCursorChange({
                      position: editor.getPosition(),
                      selection: e.selection
                    });
                  });
                }}
                theme={`collabcode-${theme}`}
                options={{
                  fontSize: isMobile ? 12 : 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: isMobile ? 8 : 16 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: 'on',
                  cursorBlinking: 'smooth',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted select-none flex-col gap-4 p-4 text-center">
                <FileCode className="w-16 h-16 opacity-20" />
                <p>Select a file from the explorer or create a new one to start coding.</p>
              </div>
            )}
          </div>

          {/* Run bar — Premium */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border-default bg-bg-secondary/80 shrink-0 backdrop-blur-sm">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExecute}
              disabled={isExecuting}
              className={`btn-primary text-xs flex items-center gap-1.5 px-4 py-2 shrink-0 ${isExecuting ? 'run-pulse' : ''}`}
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {isExecuting ? 'Running...' : 'Run'}
            </motion.button>
            <input
              type="text"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="stdin input"
              className="input-field text-xs py-2 flex-1 min-w-0"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOutput(!showOutput)}
              className={`btn-ghost text-xs flex items-center gap-1 px-2.5 py-2 transition-all shrink-0 ${showOutput ? 'text-accent-violet bg-accent-violet/5' : ''}`}
            >
              <Terminal className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Output</span>
              {executionResult && (
                <span className={`w-1.5 h-1.5 rounded-full ${executionResult.exit_code === 0 ? 'bg-accent-emerald' : 'bg-accent-rose'}`} />
              )}
            </motion.button>
          </div>

          {/* Output panel — Enhanced */}
          <AnimatePresence>
            {showOutput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isMobile ? 180 : 220, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="border-t border-border-default bg-bg-secondary overflow-hidden shrink-0"
              >
                <div className="h-full overflow-auto p-3">
                  {isExecuting ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 text-text-secondary text-sm"
                    >
                      <div className="relative">
                        <Loader2 className="w-5 h-5 animate-spin text-accent-violet" />
                        <div className="absolute inset-0 w-5 h-5 rounded-full bg-accent-violet/20 animate-ping" />
                      </div>
                      <span>Executing code...</span>
                    </motion.div>
                  ) : executionResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-mono text-xs space-y-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {executionResult.exit_code === 0 ? (
                          <span className="flex items-center gap-1.5 text-[11px] bg-accent-emerald/10 text-accent-emerald px-2 py-0.5 rounded-full font-semibold">
                            <Check className="w-3 h-3" /> Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] bg-accent-rose/10 text-accent-rose px-2 py-0.5 rounded-full font-semibold">
                            <X className="w-3 h-3" /> Error
                          </span>
                        )}
                        <span className="text-text-muted text-[11px]">{executionResult.execution_time_ms}ms</span>
                      </div>
                      {executionResult.stdout && (
                        <div className="bg-bg-primary/50 rounded-lg p-2.5 border border-border-subtle">
                          <span className="text-accent-emerald text-[10px] uppercase tracking-wider font-semibold">stdout</span>
                          <pre className="mt-1 text-text-primary whitespace-pre-wrap leading-relaxed break-all font-mono">{executionResult.stdout}</pre>
                        </div>
                      )}
                      {executionResult.stderr && (
                        <div className="bg-accent-rose/5 rounded-lg p-2.5 border border-accent-rose/10">
                          <span className="text-accent-rose text-[10px] uppercase tracking-wider font-semibold">stderr</span>
                          <pre className="mt-1 text-accent-rose/80 whitespace-pre-wrap leading-relaxed break-all font-mono">{executionResult.stderr}</pre>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Terminal className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                        <p className="text-text-muted text-xs">Click &quot;Run&quot; to execute your code</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat panel — Enhanced */}
        <AnimatePresence>
          {((!isMobile && showChat) || (isMobile && activeMobileTab === 'chat')) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? '100%' : 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="border-l max-md:border-none border-border-default bg-bg-secondary flex flex-col overflow-hidden shrink-0 h-full w-full md:w-[340px]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-accent-violet" /> Chat
                  <span className="text-[10px] bg-bg-tertiary px-1.5 py-0.5 rounded-full">{messages.length}</span>
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isMobile) {
                      setActiveMobileTab('editor');
                    } else {
                      setShowChat(false);
                    }
                  }}
                  className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
                      <p className="text-text-muted text-xs">No messages yet. Say hi! 👋</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i === messages.length - 1 ? 0 : 0 }}
                    className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                        msg.user_id === user?.id
                          ? 'bg-gradient-to-br from-accent-violet/20 to-accent-cyan/10 text-text-primary rounded-br-sm'
                          : 'bg-bg-tertiary text-text-primary rounded-bl-sm'
                      }`}>
                        {msg.user_id !== user?.id && (
                          <p className="text-[11px] text-accent-cyan font-medium mb-0.5">{msg.display_name}</p>
                        )}
                        <p className="text-[13px] break-words leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={`text-[10px] text-text-muted mt-0.5 px-1 ${msg.user_id === user?.id ? 'text-right' : ''}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-3 border-t border-border-default">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="input-field text-sm py-2 flex-1"
                    placeholder="Type a message..."
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendChat}
                    className="btn-primary p-2.5 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile-only Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-secondary/90 backdrop-blur-lg border-t border-border-default flex items-center justify-around px-2 z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'explorer', label: 'Files', icon: FileCode },
          { id: 'editor', label: 'Editor', icon: Terminal },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'whiteboard', label: 'Draw', icon: PenTool },
          { id: 'call', label: 'Call', icon: Video },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMobileTab(tab.id as any);
                audio.playClick();
                if (tab.id === 'whiteboard') {
                  setShowWhiteboard(true);
                } else if (tab.id === 'call') {
                  setShowVideoCall(true);
                }
              }}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-text-secondary"
            >
              {isActive && (
                <motion.div
                  layoutId="active-mobile-tab-bg"
                  className="absolute inset-x-2 inset-y-1.5 bg-accent-violet/10 rounded-xl border border-accent-violet/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-colors relative z-10 ${isActive ? 'text-accent-violet' : 'text-text-muted hover:text-text-primary'}`} />
              <span className={`text-[10px] font-medium transition-colors relative z-10 ${isActive ? 'text-accent-violet font-semibold' : 'text-text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Collaborative additions */}
      <CommandPalette
        onRunCode={handleExecute}
        onChangeTheme={changeTheme}
        currentTheme={theme}
        isMuted={muted}
        onToggleMute={toggleMute}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        showOutput={showOutput}
        onToggleOutput={() => setShowOutput(!showOutput)}
      />
      <Whiteboard sendMessage={sendMessage} />
      <TimeMachine currentTheme={theme} onRestoreContent={handleRestoreContent} />
      <VideoCall sendMessage={sendMessage} />

      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />
    </div>
  );
}

function getPositionFromOffset(text: string, offset: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}
