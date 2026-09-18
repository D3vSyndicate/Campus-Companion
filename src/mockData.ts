import { ChecklistItem, ContactItem, ScheduleItem } from './types';

export const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: '1',
    title: 'Welcome to the School of IT',
    date: '2027-02-04',
    startTime: '09:00',
    endTime: '10:00',
    venue: 'North Auditorium',
    description: 'Introduction to the School, staff, expectations, and student support.',
    category: 'academic',
    isPast: true, // Used to demonstrate Shame Resilience handling
  },
  {
    id: '2',
    title: 'Digital Readiness & Funda Walkthrough',
    date: '2027-02-04',
    startTime: '10:30',
    endTime: '12:00',
    venue: 'Lab 1, Goldfields Building',
    description: 'Hands-on assistance setting up email, Wi-Fi, and Funda access.',
    category: 'digital',
    isPast: false,
  },
];

export const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: '1', task: 'Activate student email', category: 'Digital', completed: true },
  { id: '2', task: 'Access Funda LMS', category: 'Digital', completed: false },
  { id: '3', task: 'Find lecture venues', category: 'Campus', completed: false },
  { id: '4', task: 'Save key IT department contacts', category: 'Support', completed: false },
];

export const MOCK_CONTACTS: ContactItem[] = [
  {
    id: '1',
    name: 'Info@IT Desk',
    role: 'Student Support Center',
    email: 'info.it@mandela.ac.za',
    office: 'Building 12, Rm 102',
    supportType: 'General queries, Funda logins, & lab access',
  },
  {
    id: '2',
    name: 'How2buddy Support',
    role: 'Senior Student Mentors',
    email: 'mentors.it@mandela.ac.za',
    office: 'Student Help Hub',
    supportType: 'Peer advice, venue navigation, and student life',
  },
];