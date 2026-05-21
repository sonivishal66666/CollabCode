'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Clock, ArrowLeftRight, Check, X, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { audio } from '@/lib/audio';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.DiffEditor),
  { ssr: false }
);

const getMonacoLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'py':
      return 'python';
    case 'cpp':
      return 'cpp';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    default:
      return 'plaintext';
  }
};

interface TimeMachineProps {
  currentTheme: string;
  onRestoreContent: (content: string) => void;
}

export function TimeMachine({ currentTheme, onRestoreContent }: TimeMachineProps) {
  const {
    showTimeMachine,
    setShowTimeMachine,
    activeFileId,
    fileRevisions,
    files,
  } = useEditorStore();

  const activeRevisions = activeFileId ? fileRevisions[activeFileId] || [] : [];
  const currentContent = activeFileId ? files[activeFileId]?.content || '' : '';

  const [selectedRevIndex, setSelectedRevIndex] = useState<number>(-1);

  // Auto-capture initial revision if none recorded yet when opened
  useEffect(() => {
    if (showTimeMachine && activeFileId && activeRevisions.length === 0 && currentContent) {
      useEditorStore.getState().addRevision(activeFileId, currentContent, 'Initial Version');
    }
  }, [showTimeMachine, activeFileId, activeRevisions.length, currentContent]);

  // Set default selected revision to last one when opened
  useEffect(() => {
    if (showTimeMachine && activeRevisions.length > 0) {
      setSelectedRevIndex(activeRevisions.length - 1);
    } else {
      setSelectedRevIndex(-1);
    }
  }, [showTimeMachine, activeRevisions.length]);

  if (!showTimeMachine || !activeFileId) return null;

  // Derive the active index immediately during render to eliminate flashes
  const activeIndex = selectedRevIndex === -1 && activeRevisions.length > 0
    ? activeRevisions.length - 1
    : selectedRevIndex;

  const selectedRevision = activeRevisions[activeIndex];
  const revisionContent = selectedRevision ? selectedRevision.content : '';

  const handleRestore = () => {
    if (!selectedRevision) return;
    audio.playSuccess();
    onRestoreContent(selectedRevision.content);
    setShowTimeMachine(false);
  };

  const handleScrub = (index: number) => {
    if (index >= 0 && index < activeRevisions.length) {
      setSelectedRevIndex(index);
      audio.playClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="fixed inset-4 z-40 glass-panel neon-glow rounded-xl flex flex-col overflow-hidden border border-border-default bg-bg-primary/95 backdrop-blur-xl"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-default bg-bg-secondary/60 shrink-0">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-accent-cyan animate-pulse" />
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              Workspace Time Machine
              <span className="text-[10px] bg-bg-tertiary px-2 py-0.5 rounded-full font-mono text-text-muted font-normal">
                {activeFileId}
              </span>
            </h2>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Scrub backwards in time to compare and restore past document states.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedRevision && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRestore}
              className="p-2 rounded-lg bg-accent-emerald/10 hover:bg-accent-emerald/20 border border-accent-emerald/30 text-accent-emerald transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore This Revision
            </motion.button>
          )}
          <button
            onClick={() => { setShowTimeMachine(false); audio.playPop(); }}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Diff Editor Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {activeRevisions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
            <Clock className="w-12 h-12 text-text-muted/20" />
            <p className="text-text-muted text-sm font-medium">No recorded revisions for this file yet.</p>
            <p className="text-text-muted text-xs max-w-xs">
              Revisions are captured automatically in the background as you write code. Keep typing to populate the timeline.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full">
            {/* Sidebar with revision list */}
            <div className="w-full lg:w-72 border-r border-border-default bg-bg-secondary/30 flex flex-col shrink-0">
              <div className="px-4 py-2 border-b border-border-default text-[10px] font-bold text-accent-violet uppercase tracking-wider">
                Revision History ({activeRevisions.length})
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {activeRevisions.map((rev, idx) => {
                  const isSelected = idx === activeIndex;
                  const date = new Date(rev.timestamp);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleScrub(idx)}
                      className={`px-4 py-2.5 cursor-pointer border-l-2 transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-accent-violet/15 to-transparent border-accent-violet text-text-primary'
                          : 'border-transparent text-text-secondary hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                        isSelected ? 'bg-accent-violet/20 text-accent-violet' : 'bg-bg-tertiary text-text-muted'
                      }`}>
                        v{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{rev.username || 'Collaborator'}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monaco Comparison diff pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-bg-primary relative">
              <div className="px-4 py-2 border-b border-border-default bg-bg-secondary/40 flex items-center justify-between text-xs text-text-secondary select-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-accent-rose">v{activeIndex + 1} Revision</span>
                  <span className="opacity-40">→</span>
                  <span className="font-semibold text-accent-emerald">Current Live Version</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={activeIndex <= 0}
                    onClick={() => handleScrub(activeIndex - 1)}
                    className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[10px]">
                    {activeIndex + 1} / {activeRevisions.length}
                  </span>
                  <button
                    disabled={activeIndex >= activeRevisions.length - 1}
                    onClick={() => handleScrub(activeIndex + 1)}
                    className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <MonacoDiffEditor
                  original={revisionContent}
                  modified={currentContent}
                  language={getMonacoLanguage(activeFileId)}
                  theme={`collabcode-${currentTheme}`}
                  options={{
                    readOnly: true,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    renderSideBySide: true,
                    smoothScrolling: true,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline scrubber bar at the bottom */}
      {activeRevisions.length > 1 && (
        <div className="px-6 py-4 border-t border-border-default bg-bg-secondary/60 shrink-0 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] text-text-muted select-none uppercase tracking-wider font-bold">
            <span>Older Revisions</span>
            <span className="text-accent-cyan">Timeline Scrubber</span>
            <span>Latest Revision</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max={activeRevisions.length - 1}
              value={activeIndex}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="flex-1 accent-accent-cyan h-1.5 bg-bg-tertiary rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
              v{activeIndex + 1}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
