export interface User {
  id: string;
  name: string;
  email: string;
  working_hours_start: number;
  working_hours_end: number;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimated_duration?: number;
  completed_at?: string;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  day_of_week?: number;
  created_at: string;
}

export interface Stats {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  };
  dailyData: Array<{
    date: string;
    total: number;
    completed: number;
    rate: number;
  }>;
  priorityStats: {
    high: { total: number; completed: number };
    medium: { total: number; completed: number };
    low: { total: number; completed: number };
  };
  hourlyProductivity: Array<{
    hour: number;
    total: number;
    completed: number;
    rate: number;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}