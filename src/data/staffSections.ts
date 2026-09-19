import type { StaffSection } from '../components/StaffDashboard';

// The content areas that staff manage. Each area's screens live at /<area>/<slug>, so one list serves
// both dashboards and they cannot drift apart.
//
// Coordinators manage the everyday content. The rest is admin only: those screens were taken out of the
// coordinator area, and the admin area still has them.
const CONTENT: (Omit<StaffSection, 'href'> & { slug: string; adminOnly?: boolean })[] = [
  { slug: 'announcements', label: 'Announcements', desc: 'Manage student updates', icon: 'megaphone-outline' },
  { slug: 'schedule', label: 'Orientation Schedule', desc: 'The timetable first-years follow', icon: 'calendar-outline' },
  { slug: 'venue', label: 'Venues', desc: 'Manage campus locations', icon: 'location-outline' },
  { slug: 'faqs', label: 'FAQs', desc: 'Manage common questions', icon: 'help-circle-outline' },
  { slug: 'checklist', label: 'Checklist', desc: 'Manage student tasks', icon: 'checkmark-circle-outline' },
  { slug: 'support', label: 'Support', desc: 'Manage support pathways', icon: 'heart-outline' },
  { slug: 'digital', label: 'Digital Readiness', desc: 'Guides and their steps for new students', icon: 'laptop-outline' },
  { slug: 'contacts', label: 'Contacts', desc: 'Manage support contacts', icon: 'people-outline' },
  { slug: 'shuttle', label: 'Shuttle Times', desc: 'Morning, afternoon and night departures', icon: 'bus-outline', adminOnly: true },
  { slug: 'events', label: 'Campus Events', desc: 'What is on around campus, open to everyone', icon: 'ticket-outline', adminOnly: true },
  { slug: 'sport', label: 'Sport & Gym', desc: 'Clubs, facilities and gym sign-up', icon: 'barbell-outline', adminOnly: true },
  { slug: 'programmes', label: 'Programmes', desc: 'School of IT programmes and advisors', icon: 'school-outline', adminOnly: true },
  { slug: 'tribes', label: 'Tribes', desc: 'Create mentor groups for first-years', icon: 'people-circle-outline', adminOnly: true },
  { slug: 'buddies', label: 'Buddies', desc: 'Place FYS buddies in tribes', icon: 'ribbon-outline', adminOnly: true },
  { slug: 'faq-suggestions', label: 'FAQ Suggestions', desc: 'Questions buddies keep hearing', icon: 'chatbox-ellipses-outline', adminOnly: true },
];

export function contentSections(area: '(coordinator)' | '(admin)'): StaffSection[] {
  return CONTENT.filter((section) => area === '(admin)' || !section.adminOnly).map(({ slug, adminOnly: _adminOnly, ...section }) => ({
    ...section,
    href: `/${area}/${slug}`,
  }));
}
