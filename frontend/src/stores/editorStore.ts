import { create } from 'zustand';
import type { OnlineUser, FileNode } from '@/types';

interface EditorState {
  files: Record<string, FileNode>;
  activeFileId: string | null;
  openTabs: string[];
  language: string;
  isExecuting: boolean;
  executionResult: { stdout: string; stderr: string; exit_code: number; execution_time_ms: number } | null;
  onlineUsers: Map<string, OnlineUser>;
  
  showWhiteboard: boolean;
  showTimeMachine: boolean;
  showCommandPalette: boolean;
  showVideoCall: boolean;
  fileRevisions: Record<string, Array<{ content: string; timestamp: number; username: string }>>;

  setShowWhiteboard: (show: boolean) => void;
  setShowTimeMachine: (show: boolean) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowVideoCall: (show: boolean) => void;
  addRevision: (fileId: string, content: string, username: string) => void;
  
  setFiles: (files: Record<string, FileNode>) => void;
  updateFileContent: (fileId: string, content: string, version?: number) => void;
  updateFileVersion: (fileId: string, version: number) => void;
  addFile: (file: FileNode) => void;
  removeFile: (fileId: string) => void;
  renameFile: (oldFileId: string, newFileId: string) => void;
  
  setActiveFile: (fileId: string) => void;
  openTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;

  setLanguage: (language: string) => void;
  setExecuting: (executing: boolean) => void;
  setExecutionResult: (result: { stdout: string; stderr: string; exit_code: number; execution_time_ms: number } | null) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: OnlineUser['cursor']) => void;
  clearOnlineUsers: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  files: {},
  activeFileId: null,
  openTabs: [],
  language: 'javascript',
  isExecuting: false,
  executionResult: null,
  onlineUsers: new Map(),

  showWhiteboard: false,
  showTimeMachine: false,
  showCommandPalette: false,
  showVideoCall: false,
  fileRevisions: {},

  setShowWhiteboard: (showWhiteboard) => set({ showWhiteboard }),
  setShowTimeMachine: (showTimeMachine) => set({ showTimeMachine }),
  setShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
  setShowVideoCall: (showVideoCall) => set({ showVideoCall }),
  addRevision: (fileId, content, username) => set((state) => {
    const revisions = state.fileRevisions[fileId] || [];
    // Only add if content is different from the last revision to save space
    const lastRev = revisions[revisions.length - 1];
    if (lastRev && lastRev.content === content) return state;

    const newRev = { content, timestamp: Date.now(), username };
    const updatedRevisions = [...revisions, newRev].slice(-100); // Limit to last 100 snapshots
    return {
      fileRevisions: {
        ...state.fileRevisions,
        [fileId]: updatedRevisions
      }
    };
  }),

  setFiles: (files) => set({ files }),
  updateFileContent: (fileId, content, version) => set((state) => {
    const file = state.files[fileId];
    if (!file) return state;
    return {
      files: {
        ...state.files,
        [fileId]: { ...file, content, version: version ?? file.version }
      }
    };
  }),
  updateFileVersion: (fileId, version) => set((state) => {
    const file = state.files[fileId];
    if (!file) return state;
    return { files: { ...state.files, [fileId]: { ...file, version } } };
  }),
  addFile: (file) => set((state) => ({
    files: { ...state.files, [file.id]: file }
  })),
  removeFile: (fileId) => set((state) => {
    const newFiles = { ...state.files };
    delete newFiles[fileId];
    const newTabs = state.openTabs.filter(id => id !== fileId);
    return {
      files: newFiles,
      openTabs: newTabs,
      activeFileId: state.activeFileId === fileId ? (newTabs[0] || null) : state.activeFileId
    };
  }),
  renameFile: (oldId, newId) => set((state) => {
    const file = state.files[oldId];
    if (!file) return state;
    const newFiles = { ...state.files };
    delete newFiles[oldId];
    newFiles[newId] = { ...file, id: newId, name: newId };
    
    return {
      files: newFiles,
      openTabs: state.openTabs.map(id => id === oldId ? newId : id),
      activeFileId: state.activeFileId === oldId ? newId : state.activeFileId
    };
  }),

  setActiveFile: (activeFileId) => set((state) => {
    if (!state.openTabs.includes(activeFileId)) {
      return { activeFileId, openTabs: [...state.openTabs, activeFileId] };
    }
    return { activeFileId };
  }),
  openTab: (fileId) => set((state) => {
    if (!state.openTabs.includes(fileId)) {
      return { openTabs: [...state.openTabs, fileId], activeFileId: fileId };
    }
    return { activeFileId: fileId };
  }),
  closeTab: (fileId) => set((state) => {
    const newTabs = state.openTabs.filter(id => id !== fileId);
    return {
      openTabs: newTabs,
      activeFileId: state.activeFileId === fileId ? (newTabs[newTabs.length - 1] || null) : state.activeFileId
    };
  }),

  setLanguage: (language) => set({ language }),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionResult: (executionResult) => set({ executionResult }),
  addOnlineUser: (user) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.set(user.user_id, user);
      return { onlineUsers: newMap };
    }),
  removeOnlineUser: (userId) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.delete(userId);
      return { onlineUsers: newMap };
    }),
  updateUserCursor: (userId, cursor) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      const user = newMap.get(userId);
      if (user) {
        newMap.set(userId, { ...user, cursor });
      }
      return { onlineUsers: newMap };
    }),
  clearOnlineUsers: () => set({ onlineUsers: new Map() }),
}));
