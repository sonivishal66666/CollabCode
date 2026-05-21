import { useEffect, useRef } from 'react';
import type { OnlineUser } from '@/types';

const colors = [
  '#8b5cf6', // Violet
  '#22d3ee', // Cyan
  '#34d399', // Emerald
  '#fb7185', // Rose
  '#fbbf24', // Amber
  '#e76f00', // Orange
  '#f43f5e', // Rose-deep
  '#a855f7', // Purple-bright
  '#10b981', // Emerald-dark
];

export function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

interface UseRemoteDecorationsProps {
  editor: any;
  monaco: any;
  onlineUsers: Map<string, OnlineUser>;
  activeFileId: string | null;
}

export function useRemoteDecorations({
  editor,
  monaco,
  onlineUsers,
  activeFileId,
}: UseRemoteDecorationsProps) {
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inject base styles for remote cursors
    let baseStyleEl = document.getElementById('remote-cursor-base-styles');
    if (!baseStyleEl) {
      baseStyleEl = document.createElement('style');
      baseStyleEl.id = 'remote-cursor-base-styles';
      baseStyleEl.innerHTML = `
        .remote-cursor {
          width: 2px !important;
          position: absolute;
          transition: all 0.08s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .remote-cursor::after {
          content: var(--username);
          position: absolute;
          top: -18px;
          left: 2px;
          background-color: var(--color);
          color: #05050a;
          font-family: var(--font-sans), sans-serif;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0.85;
          transform: scale(0.9);
          transform-origin: bottom left;
          transition: opacity 0.15s ease, transform 0.15s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 100;
        }
        .remote-cursor:hover::after {
          opacity: 1;
          transform: scale(1);
        }
      `;
      document.head.appendChild(baseStyleEl);
    }

    return () => {
      // Clean up decorations on unmount
      if (editor && decorationIdsRef.current.length > 0) {
        editor.deltaDecorations(decorationIdsRef.current, []);
        decorationIdsRef.current = [];
      }
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || !monaco || !activeFileId) return;

    // Update individual user styles dynamically
    let userStyleEl = document.getElementById('remote-cursor-user-styles');
    if (!userStyleEl) {
      userStyleEl = document.createElement('style');
      userStyleEl.id = 'remote-cursor-user-styles';
      document.head.appendChild(userStyleEl);
    }

    let css = '';
    const newDecorations: any[] = [];

    Array.from(onlineUsers.values()).forEach((u) => {
      if (!u.cursor || u.cursor.file_id !== activeFileId) return;

      const { line, column, selection, user_name } = u.cursor;
      const color = getUserColor(u.user_id);

      css += `
        .remote-cursor-${u.user_id} {
          --color: ${color};
          --username: "${user_name}";
          background-color: ${color} !important;
          box-shadow: 0 0 6px ${color}80;
        }
        .remote-selection-${u.user_id} {
          background-color: ${color}1c !important;
          border-left: 1px solid ${color}40;
          border-right: 1px solid ${color}40;
        }
      `;

      // Cursor position decoration
      newDecorations.push({
        range: new monaco.Range(line, column, line, column),
        options: {
          className: `remote-cursor remote-cursor-${u.user_id}`,
          hoverMessage: { value: `**${user_name}** is coding here` },
        },
      });

      // Selection decoration
      if (
        selection &&
        (selection.start_line !== selection.end_line ||
          selection.start_column !== selection.end_column)
      ) {
        newDecorations.push({
          range: new monaco.Range(
            selection.start_line,
            selection.start_column,
            selection.end_line,
            selection.end_column
          ),
          options: {
            className: `remote-selection remote-selection-${u.user_id}`,
          },
        });
      }
    });

    userStyleEl.innerHTML = css;

    // Apply decorations
    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      newDecorations
    );
  }, [onlineUsers, activeFileId, editor, monaco]);
}
