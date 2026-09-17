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
  task: string;
  category: string;
  completed: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  role: string;
  email: string;
  office: string;
  supportType: string;
}