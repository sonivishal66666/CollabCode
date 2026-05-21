'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { audio } from '@/lib/audio';

// File type colors based on extension
const extColorMap: Record<string, string> = {
  '.java': '#E76F00',
  '.js': '#F7DF1E',
  '.jsx': '#61DAFB',
  '.ts': '#3178C6',
  '.tsx': '#3178C6',
  '.py': '#3776AB',
  '.go': '#00ADD8',
  '.cpp': '#00599C',
  '.c': '#A8B9CC',
  '.css': '#1572B6',
  '.html': '#E34F26',
  '.json': '#F7DF1E',
  '.md': '#083fa1',
};

function getExtColor(name: string): string {
  const ext = '.' + name.split('.').pop()?.toLowerCase();
  return extColorMap[ext] || '#8888a0';
}

export function EditorTabs() {
  const { openTabs, activeFileId, setActiveFile, closeTab } = useEditorStore();

  if (openTabs.length === 0) return null;

  return (
    <div className="flex bg-bg-secondary border-b border-border-default overflow-x-auto no-scrollbar shrink-0 relative">
      {/* Gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg-secondary to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-bg-secondary to-transparent z-10 pointer-events-none" />

      <AnimatePresence initial={false}>
        {openTabs.map((fileId) => {
          const name = fileId.split('/').pop() || fileId;
          const isActive = activeFileId === fileId;
          const dotColor = getExtColor(name);

          return (
            <motion.div
              key={fileId}
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={`group flex items-center gap-2 px-4 py-2 border-r border-border-default cursor-pointer select-none relative overflow-hidden ${
                isActive
                  ? 'bg-bg-primary text-text-primary'
                  : 'bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
              onClick={() => {
                audio.playPop();
                setActiveFile(fileId);
              }}
            >
              {/* Language color dot */}
              <div
                className="w-2 h-2 rounded-full shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: isActive ? `0 0 6px ${dotColor}60` : 'none',
                }}
              />

              {/* File name */}
              <span className="truncate text-[13px] max-w-[140px]">{name}</span>

              {/* Close button */}
              <button
                className={`p-0.5 rounded transition-all ${
                  isActive
                    ? 'opacity-60 hover:opacity-100 hover:bg-white/10'
                    : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-white/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                  closeTab(fileId);
                }}
              >
                <X className="w-3 h-3" />
              </button>

              {/* Active tab indicator */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-violet to-accent-cyan"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
