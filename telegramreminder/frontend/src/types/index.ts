export interface User {
  id: string;
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isAuthorized: boolean;
  isAdmin: boolean;
  createdAt?: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  telegramId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
  isActive: boolean;
  description?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}
