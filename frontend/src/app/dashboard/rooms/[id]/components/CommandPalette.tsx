'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Play, Sparkles, PenTool, History, Video,
  MessageSquare, Volume2, VolumeX, FileCode, Terminal, X
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { audio } from '@/lib/audio';

interface CommandItem {
  id: string;
  name: string;
  category: string;
  shortcut?: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

interface CommandPaletteProps {
  onRunCode: () => void;
  onChangeTheme: (theme: 'midnight' | 'cyberpunk' | 'tokyo-night' | 'dracula') => void;
  currentTheme: string;
  isMuted: boolean;
  onToggleMute: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  showOutput: boolean;
  onToggleOutput: () => void;
}

export function CommandPalette({
  onRunCode,
  onChangeTheme,
  currentTheme,
  isMuted,
  onToggleMute,
  showChat,
  onToggleChat,
  showOutput,
  onToggleOutput,
}: CommandPaletteProps) {
  const {
    showCommandPalette,
    setShowCommandPalette,
    files,
    setActiveFile,
    showWhiteboard,
    setShowWhiteboard,
    showTimeMachine,
    setShowTimeMachine,
    showVideoCall,
    setShowVideoCall,
  } = useEditorStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (showCommandPalette) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [showCommandPalette]);

  // Handle global Cmd/Ctrl + K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
        audio.playPop();
      } else if (e.key === 'Escape' && showCommandPalette) {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, setShowCommandPalette]);

  if (!showCommandPalette) return null;

  // Build command list dynamically
  const commands: CommandItem[] = [
    {
      id: 'run-code',
      name: 'Run Source Code',
      category: 'Actions',
      shortcut: 'Ctrl + R',
      icon: Play,
      action: () => {
        onRunCode();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-whiteboard',
      name: `${showWhiteboard ? 'Close' : 'Open'} Collaborative Whiteboard`,
      category: 'Views',
      shortcut: 'W',
      icon: PenTool,
      action: () => {
        setShowWhiteboard(!showWhiteboard);
        audio.playClick();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-time-machine',
      name: `${showTimeMachine ? 'Close' : 'Open'} Revision Time Machine`,
      category: 'Views',
      shortcut: 'T',
      icon: History,
      action: () => {
        setShowTimeMachine(!showTimeMachine);
        audio.playClick();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-video-call',
      name: `${showVideoCall ? 'Leave' : 'Join'} Video & Voice Call`,
      category: 'Views',
      shortcut: 'V',
      icon: Video,
      action: () => {
        setShowVideoCall(!showVideoCall);
        audio.playClick();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-chat',
      name: `${showChat ? 'Hide' : 'Show'} Chat Pane`,
      category: 'Views',
      shortcut: 'C',
      icon: MessageSquare,
      action: () => {
        onToggleChat();
        audio.playClick();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-output',
      name: `${showOutput ? 'Hide' : 'Show'} Terminal Output`,
      category: 'Views',
      shortcut: 'O',
      icon: Terminal,
      action: () => {
        onToggleOutput();
        audio.playClick();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-mute',
      name: isMuted ? 'Unmute Systems' : 'Mute Systems',
      category: 'Settings',
      shortcut: 'M',
      icon: isMuted ? Volume2 : VolumeX,
      action: () => {
        onToggleMute();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'theme-midnight',
      name: 'Activate Midnight Theme',
      category: 'Themes',
      icon: Sparkles,
      action: () => onChangeTheme('midnight'),
    },
    {
      id: 'theme-cyberpunk',
      name: 'Activate Cyberpunk Theme',
      category: 'Themes',
      icon: Sparkles,
      action: () => onChangeTheme('cyberpunk'),
    },
    {
      id: 'theme-tokyo-night',
      name: 'Activate Tokyo Night Theme',
      category: 'Themes',
      icon: Sparkles,
      action: () => onChangeTheme('tokyo-night'),
    },
    {
      id: 'theme-dracula',
      name: 'Activate Dracula Theme',
      category: 'Themes',
      icon: Sparkles,
      action: () => onChangeTheme('dracula'),
    },
  ];

  // Append open files to switch actions
  const fileActions: CommandItem[] = Object.keys(files).map((fileId) => ({
    id: `file-${fileId}`,
    name: `Switch to: ${fileId}`,
    category: 'Workspace Files',
    icon: FileCode,
    action: () => {
      setActiveFile(fileId);
      audio.playPop();
      setShowCommandPalette(false);
    },
  }));

  const allItems = [...commands, ...fileActions];

  // Filter items based on search query
  const filteredItems = allItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      audio.playClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      audio.playClick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowCommandPalette(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Palette Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-xl glass-panel neon-glow rounded-xl overflow-hidden relative z-10 mx-4 border border-border-default bg-bg-glass"
        >
          {/* Header query line */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-default bg-bg-secondary/40">
            <Search className="w-4.5 h-4.5 text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search actions, files, themes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-sm w-full outline-none text-text-primary placeholder-text-muted"
            />
            <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-text-muted select-none">
              ESC
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-[350px] overflow-y-auto py-2 no-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted">
                No commands or files match your search query.
              </div>
            ) : (
              (() => {
                let currentCategory = '';
                return filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const showCatHeader = item.category !== currentCategory;
                  currentCategory = item.category;

                  return (
                    <div key={item.id}>
                      {showCatHeader && (
                        <div className="px-4 py-1.5 text-[10px] font-bold text-accent-violet uppercase tracking-wider bg-white/[0.01] border-y border-white/[0.02]">
                          {item.category}
                        </div>
                      )}
                      <div
                        onClick={() => item.action()}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs transition-all relative ${
                          isSelected
                            ? 'bg-gradient-to-r from-accent-violet/15 to-accent-cyan/5 text-text-primary border-l-2 border-accent-violet'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${isSelected ? 'text-accent-cyan' : 'text-text-muted'}`} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.shortcut && (
                          <span className="text-[10px] opacity-60 font-mono bg-white/5 px-1 rounded">
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-default bg-bg-secondary/40 text-[10px] text-text-muted select-none">
            <span>Use ↑↓ keys to navigate, <span className="font-semibold text-text-secondary">Enter</span> to select</span>
            <span>Ctrl + K</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
