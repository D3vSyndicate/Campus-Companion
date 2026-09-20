import type { StaffSection } from '../components/StaffDashboard';

// The content areas that staff manage. Each area's screens live at /<area>/<slug>, so one list serves
// both dashboards and they cannot drift apart.
//
// Everything students rely on every day comes first. The rest supports it. Coordinators and admins share
// most of it; tribes, buddies, campus events and FAQ suggestions are admin only.
//
// Sport & gym, shuttle times and programmes are not managed here. Sport & gym and the shuttle schedule
// ship inside the app, and programmes are edited in the database. The screens for them were taken out
// of the admin area to keep it focused.
const EVERYDAY = 'Everyday';
const SUPPORT = 'Support and community';

const CONTENT: (Omit<StaffSection, 'href'> & { slug: string; adminOnly?: boolean })[] = [
  { slug: 'announcements', label: 'Announcements', desc: 'Post updates students see first', icon: 'megaphone-outline', group: EVERYDAY },
  { slug: 'schedule', label: 'Orientation Schedule', desc: 'The timetable first-years follow', icon: 'calendar-outline', group: EVERYDAY },
  { slug: 'faqs', label: 'FAQs', desc: 'Answers to common questions', icon: 'help-circle-outline', group: EVERYDAY },
  { slug: 'contacts', label: 'Contacts', desc: 'The student support directory', icon: 'people-outline', group: EVERYDAY },
  { slug: 'emergency', label: 'Emergency Contacts', desc: 'Numbers students call for urgent help', icon: 'alert-circle-outline', group: EVERYDAY },
  { slug: 'venue', label: 'Venues', desc: 'Manage campus locations', icon: 'location-outline', group: SUPPORT },
  { slug: 'checklist', label: 'Checklist', desc: 'Tasks students tick off', icon: 'checkmark-circle-outline', group: SUPPORT },
  { slug: 'support', label: 'Support', desc: 'Manage support pathways', icon: 'heart-outline', group: SUPPORT },
  { slug: 'digital', label: 'Digital Readiness', desc: 'Guides and their steps for new students', icon: 'laptop-outline', group: SUPPORT },
  { slug: 'events', label: 'Campus Events', desc: 'What is on around campus', icon: 'ticket-outline', group: SUPPORT, adminOnly: true },
  { slug: 'tribes', label: 'Tribes', desc: 'Create mentor groups for first-years', icon: 'people-circle-outline', group: SUPPORT, adminOnly: true },
  { slug: 'buddies', label: 'Buddies', desc: 'Place FYS buddies in tribes', icon: 'ribbon-outline', group: SUPPORT, adminOnly: true },
  { slug: 'faq-suggestions', label: 'FAQ Suggestions', desc: 'Questions buddies keep hearing', icon: 'chatbox-ellipses-outline', group: SUPPORT, adminOnly: true },
];

export function contentSections(area: '(coordinator)' | '(admin)'): StaffSection[] {
  return CONTENT.filter((section) => area === '(admin)' || !section.adminOnly).map(({ slug, adminOnly: _adminOnly, ...section }) => ({
    ...section,
    href: `/${area}/${slug}`,
  }));
}
