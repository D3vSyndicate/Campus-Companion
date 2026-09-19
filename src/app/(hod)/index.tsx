import { StaffDashboard, type StaffSection } from '../../components/StaffDashboard';

const SECTIONS: StaffSection[] = [
  {
    href: '/(hod)/programme',
    label: 'Programme Information',
    desc: 'What students should know about the programme',
    icon: 'school-outline',
  },
  {
    href: '/(hod)/expectations',
    label: 'Departmental Expectations',
    desc: 'Attendance, conduct and submissions',
    icon: 'clipboard-outline',
  },
  {
    href: '/(hod)/resources',
    label: 'Support Resources',
    desc: 'Guides, forms and helpful links',
    icon: 'help-buoy-outline',
  },
  {
    href: '/(hod)/assignments',
    label: 'Assignments',
    desc: 'Departmental tasks and deadlines',
    icon: 'document-text-outline',
  },
  {
    href: '/(hod)/contacts',
    label: 'Department Contacts',
    desc: 'Academic and support contacts',
    icon: 'people-outline',
  },
];

export default function HodDashboard() {
  return (
    <StaffDashboard
      sections={SECTIONS}
      roleTitle="Head of Department"
      description="Give students one dependable place for programme guidance, expectations, assignments and support."
      statusText="Department content is ready"
      sectionTitle="Support your department"
      footerText="Department management for the School of IT"
      profileHref="/(hod)/profile"
    />
  );
}
