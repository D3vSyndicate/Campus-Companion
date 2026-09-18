export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  category: 'academic' | 'support' | 'social' | 'digital' | 'admin';
  isPast?: boolean;
}

export interface ChecklistItem {
  id: string;
  created_at: Date;
  task_description: string;
  category: string;
  completion_status: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  surname: string;
  role: string;
  email: string;
  support_category: string;
}