import { StaffDashboard } from '../../components/StaffDashboard';
import { contentSections } from '../../data/staffSections';

const SECTIONS = contentSections('(admin)');

export default function DashboardScreen() {
  return (
    <StaffDashboard
      sections={SECTIONS}
      roleTitle="Administrator"
      description="Keep announcements, the schedule, FAQs, contacts and emergency numbers accurate, and look after tribes and buddies."
      statusText="Students count on this being up to date"
      sectionTitle="What would you like to update?"
      footerText="Administration for the School of IT"
      profileHref="/(admin)/profile"
    />
  );
}
