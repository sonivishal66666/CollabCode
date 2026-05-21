'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, File, Folder, FolderPlus, FilePlus,
  Search, X, Trash2, MoreHorizontal
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import type { WSMessage } from '@/types';
import { audio } from '@/lib/audio';

// File type icon colors based on extension
const fileIconMap: Record<string, { color: string; label: string }> = {
  '.java': { color: '#E76F00', label: 'J' },
  '.js': { color: '#F7DF1E', label: 'JS' },
  '.jsx': { color: '#61DAFB', label: 'JX' },
  '.ts': { color: '#3178C6', label: 'TS' },
  '.tsx': { color: '#3178C6', label: 'TX' },
  '.py': { color: '#3776AB', label: 'PY' },
  '.go': { color: '#00ADD8', label: 'GO' },
  '.cpp': { color: '#00599C', label: 'C+' },
  '.c': { color: '#A8B9CC', label: 'C' },
  '.h': { color: '#A8B9CC', label: 'H' },
  '.css': { color: '#1572B6', label: '#' },
  '.html': { color: '#E34F26', label: '<>' },
  '.json': { color: '#F7DF1E', label: '{}' },
  '.md': { color: '#083fa1', label: 'MD' },
  '.txt': { color: '#888', label: 'TX' },
  '.xml': { color: '#E34F26', label: 'XM' },
  '.yml': { color: '#CB171E', label: 'YM' },
  '.yaml': { color: '#CB171E', label: 'YM' },
  '.sh': { color: '#4EAA25', label: '$' },
  '.sql': { color: '#336791', label: 'SQ' },
};

function getFileIcon(name: string) {
  const ext = '.' + name.split('.').pop()?.toLowerCase();
  return fileIconMap[ext] || { color: '#8888a0', label: '•' };
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: Record<string, TreeNode>;
}

interface FileExplorerProps {
  sendMessage: (msg: WSMessage) => void;
}

export function FileExplorer({ sendMessage }: FileExplorerProps) {
  const { files, activeFileId, openTab, addFile, removeFile } = useEditorStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [createTarget, setCreateTarget] = useState<{ folder: string; mode: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; type: 'file' | 'folder' } | null>(null);

  const tree = useMemo(() => {
    const root: Record<string, TreeNode> = {};
    Object.values(files).forEach((file) => {
      const parts = file.id.split('/');
      let currentLevel = root;
      let currentPath = '';
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : {},
          };
        }
        if (!isLast) {
          currentLevel = currentLevel[part].children!;
        }
      });
    });
    return root;
  }, [files]);

  const fileCount = Object.keys(files).length;

  const toggleFolder = useCallback((path: string) => {
    audio.playClick();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleCreate = useCallback((folderPath: string, mode: 'file' | 'folder') => {
    if (!newName.trim()) {
      setCreateTarget(null);
      return;
    }
    const trimmed = newName.trim();
    if (mode === 'folder') {
      // Create a placeholder file to register the folder
      const placeholderPath = folderPath ? `${folderPath}/${trimmed}/.gitkeep` : `${trimmed}/.gitkeep`;
      if (!files[placeholderPath]) {
        addFile({ id: placeholderPath, name: '.gitkeep', content: '', version: 0 });
        sendMessage({
          type: 'workspace:update',
          payload: { action: 'create', file_id: placeholderPath, content: '', is_dir: true },
        });
      }
      setExpandedFolders(prev => new Set(prev).add(folderPath ? `${folderPath}/${trimmed}` : trimmed));
    } else {
      const fullPath = folderPath ? `${folderPath}/${trimmed}` : trimmed;
      if (!files[fullPath]) {
        addFile({ id: fullPath, name: trimmed, content: '', version: 0 });
        openTab(fullPath);
        sendMessage({
          type: 'workspace:update',
          payload: { action: 'create', file_id: fullPath, content: '' },
        });
      }
    }
    setCreateTarget(null);
    setNewName('');
  }, [newName, files, addFile, openTab, sendMessage]);

  const handleDelete = useCallback((path: string, type: 'file' | 'folder') => {
    audio.playAlert();
    if (type === 'folder') {
      // Delete all files under this folder
      Object.keys(files).forEach(fileId => {
        if (fileId.startsWith(path + '/') || fileId === path) {
          removeFile(fileId);
          sendMessage({
            type: 'workspace:update',
            payload: { action: 'delete', file_id: fileId },
          });
        }
      });
    } else {
      removeFile(path);
      sendMessage({
        type: 'workspace:update',
        payload: { action: 'delete', file_id: path },
      });
    }
    setContextMenu(null);
  }, [files, removeFile, sendMessage]);

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string, type: 'file' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, path, type });
  }, []);

  // Filter tree based on search
  const matchesSearch = useCallback((node: TreeNode): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.children) {
      return Object.values(node.children).some(child => matchesSearch(child));
    }
    return false;
  }, [searchQuery]);

  const renderTree = (nodes: Record<string, TreeNode>, level = 0) => {
    return Object.values(nodes)
      .filter(matchesSearch)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        const isActive = activeFileId === node.path;
        const isExpanded = expandedFolders.has(node.path);
        const icon = node.type === 'file' ? getFileIcon(node.name) : null;

        return (
          <div key={node.path}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-1 pr-2 py-[3px] cursor-pointer group relative transition-all duration-150 ${
                isActive
                  ? 'bg-accent-violet/12 text-accent-violet'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
              onClick={() => {
                if (node.type === 'folder') {
                  toggleFolder(node.path);
                } else {
                  audio.playPop();
                  openTab(node.path);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, node.path, node.type)}
            >
              {/* Indent guides */}
              {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
                  style={{ left: `${i * 16 + 20}px` }}
                />
              ))}

              {/* Chevron / File icon */}
              {node.type === 'folder' ? (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </motion.div>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}

              {/* Icon */}
              {node.type === 'folder' ? (
                <Folder className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-accent-violet' : 'text-accent-amber/70'}`} />
              ) : (
                <div
                  className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[8px] font-bold shrink-0 select-none"
                  style={{ backgroundColor: `${icon!.color}22`, color: icon!.color }}
                >
                  {icon!.label}
                </div>
              )}

              {/* Name */}
              <span className="truncate flex-1 text-[13px] select-none ml-0.5">{node.name}</span>

              {/* Actions on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {node.type === 'folder' && (
                  <>
                    <button
                      className="p-0.5 rounded hover:bg-white/10 text-text-muted hover:text-text-primary"
                      title="New file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFolders(prev => new Set(prev).add(node.path));
                        setCreateTarget({ folder: node.path, mode: 'file' });
                      }}
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-0.5 rounded hover:bg-white/10 text-text-muted hover:text-text-primary"
                      title="New folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFolders(prev => new Set(prev).add(node.path));
                        setCreateTarget({ folder: node.path, mode: 'folder' });
                      }}
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  className="p-0.5 rounded hover:bg-accent-rose/20 text-text-muted hover:text-accent-rose"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.path, node.type);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="active-file-indicator"
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-violet rounded-r"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.div>

            {/* Children */}
            <AnimatePresence initial={false}>
              {node.type === 'folder' && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {node.children && renderTree(node.children, level + 1)}

                  {/* Inline create input */}
                  {createTarget?.folder === node.path && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1 pr-2 py-[3px]"
                      style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
                    >
                      <span className="w-3.5 shrink-0" />
                      {createTarget.mode === 'folder' ? (
                        <Folder className="w-4 h-4 text-accent-amber/70 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-text-muted shrink-0" />
                      )}
                      <input
                        type="text"
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate(node.path, createTarget.mode);
                          if (e.key === 'Escape') { setCreateTarget(null); setNewName(''); }
                        }}
                        onBlur={() => handleCreate(node.path, createTarget.mode)}
                        placeholder={createTarget.mode === 'folder' ? 'folder name' : 'file name'}
                        className="flex-1 bg-bg-tertiary border border-accent-violet/50 rounded px-1.5 py-0.5 text-[13px] text-text-primary outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet/20 min-w-0"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      });
  };

  return (
    <div className="w-64 border-r border-border-default bg-bg-secondary flex flex-col shrink-0 select-none"
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Explorer</h3>
          <span className="text-[10px] bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded-full font-mono">
            {fileCount}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1 rounded transition-colors ${showSearch ? 'bg-accent-violet/10 text-accent-violet' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
            title="Search files"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreateTarget({ folder: '', mode: 'file' })}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="New file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreateTarget({ folder: '', mode: 'folder' })}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b border-border-default"
          >
            <div className="px-3 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {renderTree(tree)}

        {/* Root-level create input */}
        {createTarget?.folder === '' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 px-3 py-[3px]"
          >
            <span className="w-3.5 shrink-0" />
            {createTarget.mode === 'folder' ? (
              <Folder className="w-4 h-4 text-accent-amber/70 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-text-muted shrink-0" />
            )}
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate('', createTarget.mode);
                if (e.key === 'Escape') { setCreateTarget(null); setNewName(''); }
              }}
              onBlur={() => handleCreate('', createTarget.mode)}
              placeholder={createTarget.mode === 'folder' ? 'folder name' : 'file name'}
              className="flex-1 bg-bg-tertiary border border-accent-violet/50 rounded px-1.5 py-0.5 text-[13px] text-text-primary outline-none focus:border-accent-violet min-w-0"
            />
          </motion.div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-bg-elevated border border-border-default rounded-lg shadow-2xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'folder' && (
              <>
                <button
                  className="w-full px-3 py-1.5 text-left text-[13px] text-text-secondary hover:bg-white/5 hover:text-text-primary flex items-center gap-2"
                  onClick={() => {
                    setExpandedFolders(prev => new Set(prev).add(contextMenu.path));
                    setCreateTarget({ folder: contextMenu.path, mode: 'file' });
                    setContextMenu(null);
                  }}
                >
                  <FilePlus className="w-3.5 h-3.5" /> New File
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-[13px] text-text-secondary hover:bg-white/5 hover:text-text-primary flex items-center gap-2"
                  onClick={() => {
                    setExpandedFolders(prev => new Set(prev).add(contextMenu.path));
                    setCreateTarget({ folder: contextMenu.path, mode: 'folder' });
                    setContextMenu(null);
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5" /> New Folder
                </button>
                <div className="border-t border-border-default my-1" />
              </>
            )}
            <button
              className="w-full px-3 py-1.5 text-left text-[13px] text-accent-rose hover:bg-accent-rose/10 flex items-center gap-2"
              onClick={() => handleDelete(contextMenu.path, contextMenu.type)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
