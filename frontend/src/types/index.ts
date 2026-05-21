export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  room_code: string;
  language: string;
  is_interview: boolean;
  status: string;
  max_participants: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RoomListItem extends Room {
  role: string;
  participant_count: number;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_active_at: string;
  display_name: string;
  email: string;
}

export interface RoomWithParticipants {
  room: Room;
  participants: RoomParticipant[];
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string;
}

export interface CodeSnapshot {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  language: string;
  version: number;
  created_at: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  memory_used_kb: number;
  timed_out: boolean;
}

export interface Execution {
  id: string;
  room_id: string;
  user_id: string;
  language: string;
  code: string;
  input: string | null;
  stdout: string | null;
  stderr: string | null;
  exit_code: number | null;
  execution_time_ms: number | null;
  status: string;
  created_at: string;
}

export type WSMessageType =
  | 'ot:operation'
  | 'ot:ack'
  | 'sync:full'
  | 'sync:request'
  | 'cursor'
  | 'presence'
  | 'chat'
  | 'exec:request'
  | 'exec:result'
  | 'workspace:update'
  | 'draw:stroke'
  | 'webrtc:signal'
  | 'heartbeat'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  room_id?: string;
  user_id?: string;
  file_id?: string;
  payload: unknown;
}

export interface FileNode {
  id: string;
  name: string;
  content: string;
  version: number;
}

export interface SyncPayload {
  files: Record<string, { content: string; version: number }>;
  language: string;
}

export interface CursorData {
  line: number;
  column: number;
  user_id: string;
  user_name: string;
  file_id?: string;
  selection?: {
    start_line: number;
    start_column: number;
    end_line: number;
    end_column: number;
  };
}

export interface PresenceData {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  action: 'join' | 'leave' | 'typing';
  online: boolean;
}

export interface OnlineUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  cursor?: CursorData;
}
