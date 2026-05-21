const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    }
    return `${window.location.origin}/_/backend`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

const API_URL = getApiUrl();

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryRes = await fetch(`${this.baseURL}${path}`, { ...options, headers });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return retryRes.json();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }

    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async signup(email: string, password: string, displayName: string) {
    return this.request<{ user: { id: string; email: string; display_name: string }; access_token: string; refresh_token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: { id: string; email: string; display_name: string }; access_token: string; refresh_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ id: string; email: string; display_name: string; avatar_url: string | null }>('/api/auth/me');
  }

  // Rooms
  async createRoom(name: string, language: string, description?: string, isInterview?: boolean) {
    return this.request<{ id: string; room_code: string }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ name, language, description, is_interview: isInterview }),
    });
  }

  async listRooms() {
    return this.request<Array<{ id: string; name: string; room_code: string; language: string; is_interview: boolean; participant_count: number; role: string; created_at: string; updated_at: string }>>('/api/rooms');
  }

  async getRoom(id: string) {
    return this.request<{ room: { id: string; name: string; room_code: string; language: string; is_interview: boolean }; participants: Array<{ user_id: string; display_name: string; role: string }> }>(`/api/rooms/${id}`);
  }

  async joinRoom(roomCode: string) {
    return this.request<{ room_id: string; message: string }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ room_code: roomCode }),
    });
  }

  async deleteRoom(id: string) {
    return this.request<{ message: string }>(`/api/rooms/${id}`, { method: 'DELETE' });
  }

  async saveSnapshot(roomId: string, content: string, language: string) {
    return this.request(`/api/rooms/${roomId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ content, language }),
    });
  }

  async getSnapshots(roomId: string) {
    return this.request<Array<{ id: string; content: string; language: string; version: number; created_at: string }>>(`/api/rooms/${roomId}/snapshots`);
  }

  // Chat
  async getMessages(roomId: string, limit = 50) {
    return this.request<Array<{ id: string; user_id: string; content: string; display_name: string; created_at: string }>>(`/api/rooms/${roomId}/messages?limit=${limit}`);
  }

  // Execution
  async executeCode(roomId: string, language: string, files: Array<{ name: string; content: string }>, input?: string) {
    return this.request<{ stdout: string; stderr: string; exit_code: number; execution_time_ms: number }>('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, language, files, input }),
    });
  }

  async getLanguages() {
    return this.request<Array<{ id: string; name: string; version: string }>>('/api/execute/languages');
  }

  async getExecutions(roomId: string) {
    return this.request<Array<{ id: string; language: string; stdout: string; stderr: string; exit_code: number; execution_time_ms: number; created_at: string }>>(`/api/rooms/${roomId}/executions`);
  }
}

export const api = new ApiClient();
