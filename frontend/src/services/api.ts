import type { User, ChecklistItem, Group, Schedule, AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async validateInitData(initData: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // Checklist
  async getChecklist(): Promise<{ items: ChecklistItem[] }> {
    return this.request<{ items: ChecklistItem[] }>('/api/checklist');
  }

  async toggleItem(id: number): Promise<{ item: ChecklistItem }> {
    return this.request<{ item: ChecklistItem }>(`/api/checklist/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async addItem(text: string): Promise<{ item: ChecklistItem }> {
    return this.request<{ item: ChecklistItem }>('/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async updateItem(id: number, text: string): Promise<{ item: ChecklistItem }> {
    return this.request<{ item: ChecklistItem }>(`/api/checklist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    });
  }

  async deleteItem(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/checklist/${id}`, {
      method: 'DELETE',
    });
  }

  async resetChecklist(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/checklist/reset', {
      method: 'POST',
    });
  }

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/users');
  }

  async addUser(telegramId: string): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ telegramId }),
    });
  }

  async removeUser(telegramId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${telegramId}`, {
      method: 'DELETE',
    });
  }

  async promoteToAdmin(telegramId: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/api/users/${telegramId}/admin`, {
      method: 'POST',
    });
  }

  async demoteFromAdmin(telegramId: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/api/users/${telegramId}/admin`, {
      method: 'DELETE',
    });
  }

  // Groups
  async getGroups(): Promise<{ groups: Group[] }> {
    return this.request<{ groups: Group[] }>('/api/groups');
  }

  async addGroup(data: { name: string; contactName: string; phone: string; telegramId?: string }): Promise<{ group: Group }> {
    return this.request<{ group: Group }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroup(id: string, data: Partial<{ name: string; contactName: string; phone: string; telegramId: string }>): Promise<{ group: Group }> {
    return this.request<{ group: Group }>(`/api/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin
  async getSchedules(): Promise<{ schedules: Schedule[]; activeJobs: unknown[]; timezone: string }> {
    return this.request('/api/admin/schedules');
  }

  async getStats(): Promise<{
    users: { total: number; authorized: number; admins: number };
    checklist: { total: number; completed: number; pending: number };
    groups: number;
    schedules: number;
  }> {
    return this.request('/api/admin/stats');
  }

  async sendReminder(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/send-reminder', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
